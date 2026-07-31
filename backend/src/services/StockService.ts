import mongoose, { ClientSession, Types } from 'mongoose';
import { StockBalance, IStockBalance } from '../models/StockBalance';
import { StockLedger, VoucherType } from '../models/StockLedger';
import { Material } from '../models/Material';
import { AppError } from '../utils/AppError';

export interface StockBucketKey {
  material: string | Types.ObjectId;
  warehouse: string | Types.ObjectId;
  rack?: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
}

export interface StockMovementInput extends StockBucketKey {
  qty: number;
  uom: string;
  unitCost?: number;
  voucherType: VoucherType;
  voucherNumber: string;
  voucherId: string | Types.ObjectId;
  productionOrder?: string | Types.ObjectId;
  machine?: string | Types.ObjectId;
  operator?: string | Types.ObjectId;
  shift?: string | Types.ObjectId;
  remarks?: string;
  createdBy?: string | Types.ObjectId;
  transactionDate?: Date;
  /** When true, allow average-cost recalculation for receipts */
  allowNegative?: boolean;
}

function norm(v?: string): string {
  return (v ?? '').trim();
}

function bucketFilter(key: StockBucketKey) {
  return {
    material: key.material,
    warehouse: key.warehouse,
    rack: norm(key.rack),
    batchNumber: norm(key.batchNumber),
    heatNumber: norm(key.heatNumber),
    lotNumber: norm(key.lotNumber),
  };
}

export class StockService {
  /**
   * Post a stock IN movement (GRN, production receipt, return, transfer in, scrap recovery).
   * Uses MongoDB transaction when session is provided by caller.
   */
  async postIn(input: StockMovementInput, session?: ClientSession): Promise<{ ledger: unknown; balance: IStockBalance }> {
    if (input.qty <= 0) throw AppError.badRequest('Stock IN quantity must be greater than zero');

    const material = await Material.findById(input.material).session(session ?? null);
    if (!material) throw AppError.notFound('Material not found');

    const filter = bucketFilter(input);
    let balance = await StockBalance.findOne(filter).session(session ?? null);

    const unitCost = input.unitCost ?? material.averageCost ?? material.standardCost ?? 0;
    const qty = input.qty;

    if (!balance) {
      balance = new StockBalance({
        ...filter,
        qty: 0,
        reservedQty: 0,
        uom: input.uom || material.uom,
        unitCost,
        totalValue: 0,
      });
    }

    const prevQty = balance.qty;
    const prevValue = balance.totalValue;
    const newQty = prevQty + qty;
    const addedValue = qty * unitCost;

    // Average cost recalculation on receipt
    if (material.valuationMethod === 'Average' && newQty > 0) {
      balance.unitCost = (prevValue + addedValue) / newQty;
      material.averageCost = balance.unitCost;
      await material.save({ session });
    } else if (!balance.unitCost) {
      balance.unitCost = unitCost;
    }

    balance.qty = newQty;
    balance.totalValue = balance.qty * balance.unitCost;
    balance.uom = input.uom || balance.uom || material.uom;
    balance.lastMovementDate = input.transactionDate ?? new Date();
    if (input.createdBy) balance.updatedBy = input.createdBy as Types.ObjectId;
    await balance.save({ session });

    const ledger = await StockLedger.create(
      [
        {
          voucherType: input.voucherType,
          voucherNumber: input.voucherNumber,
          voucherId: input.voucherId,
          material: input.material,
          warehouse: input.warehouse,
          rack: norm(input.rack),
          batchNumber: norm(input.batchNumber),
          heatNumber: norm(input.heatNumber),
          lotNumber: norm(input.lotNumber),
          txnType: 'IN',
          qtyIn: qty,
          qtyOut: 0,
          balanceQty: balance.qty,
          uom: balance.uom,
          unitCost: balance.unitCost,
          totalValue: qty * balance.unitCost,
          productionOrder: input.productionOrder,
          machine: input.machine,
          operator: input.operator,
          shift: input.shift,
          transactionDate: input.transactionDate ?? new Date(),
          remarks: input.remarks,
          createdBy: input.createdBy,
        },
      ],
      { session }
    );

    return { ledger: ledger[0], balance };
  }

  /**
   * Post a stock OUT movement with FIFO when valuationMethod is FIFO,
   * otherwise consume from matching buckets (specific batch if provided).
   * Prevents negative stock unless allowNegative is set.
   */
  async postOut(input: StockMovementInput, session?: ClientSession): Promise<{
    ledgerEntries: unknown[];
    totalCost: number;
    consumed: Array<{ batchNumber: string; heatNumber: string; lotNumber: string; rack: string; qty: number; unitCost: number }>;
  }> {
    if (input.qty <= 0) throw AppError.badRequest('Stock OUT quantity must be greater than zero');

    const material = await Material.findById(input.material).session(session ?? null);
    if (!material) throw AppError.notFound('Material not found');

    const remainingToIssue = input.qty;
    const specificBatch =
      norm(input.batchNumber) || norm(input.heatNumber) || norm(input.lotNumber) || norm(input.rack);

    let buckets: IStockBalance[];

    if (specificBatch) {
      const balance = await StockBalance.findOne(bucketFilter(input)).session(session ?? null);
      buckets = balance ? [balance] : [];
    } else if (material.valuationMethod === 'FIFO') {
      buckets = await StockBalance.find({
        material: input.material,
        warehouse: input.warehouse,
        qty: { $gt: 0 },
      })
        .sort({ lastMovementDate: 1, createdAt: 1 })
        .session(session ?? null);
    } else {
      buckets = await StockBalance.find({
        material: input.material,
        warehouse: input.warehouse,
        qty: { $gt: 0 },
      })
        .sort({ createdAt: 1 })
        .session(session ?? null);
    }

    const available = buckets.reduce((s, b) => s + Math.max(0, b.qty - b.reservedQty), 0);
    if (available < remainingToIssue && !input.allowNegative) {
      throw AppError.badRequest(
        `Insufficient stock for material ${material.code}. Available: ${available}, Required: ${remainingToIssue}`
      );
    }

    let left = remainingToIssue;
    let totalCost = 0;
    const ledgerEntries: unknown[] = [];
    const consumed: Array<{
      batchNumber: string;
      heatNumber: string;
      lotNumber: string;
      rack: string;
      qty: number;
      unitCost: number;
    }> = [];

    for (const bucket of buckets) {
      if (left <= 0) break;
      const availableInBucket = Math.max(0, bucket.qty - bucket.reservedQty);
      if (availableInBucket <= 0 && !input.allowNegative) continue;

      const take = Math.min(left, availableInBucket > 0 ? availableInBucket : left);
      const unitCost = bucket.unitCost || material.averageCost || material.standardCost || 0;

      bucket.qty -= take;
      if (bucket.qty < 0 && !input.allowNegative) {
        throw AppError.badRequest(`Negative stock prevented for ${material.code}`);
      }
      bucket.totalValue = Math.max(0, bucket.qty) * unitCost;
      bucket.lastMovementDate = input.transactionDate ?? new Date();
      if (input.createdBy) bucket.updatedBy = input.createdBy as Types.ObjectId;
      await bucket.save({ session });

      const [ledger] = await StockLedger.create(
        [
          {
            voucherType: input.voucherType,
            voucherNumber: input.voucherNumber,
            voucherId: input.voucherId,
            material: input.material,
            warehouse: input.warehouse,
            rack: bucket.rack,
            batchNumber: bucket.batchNumber,
            heatNumber: bucket.heatNumber,
            lotNumber: bucket.lotNumber,
            txnType: 'OUT',
            qtyIn: 0,
            qtyOut: take,
            balanceQty: bucket.qty,
            uom: input.uom || bucket.uom,
            unitCost,
            totalValue: take * unitCost,
            productionOrder: input.productionOrder,
            machine: input.machine,
            operator: input.operator,
            shift: input.shift,
            transactionDate: input.transactionDate ?? new Date(),
            remarks: input.remarks,
            createdBy: input.createdBy,
          },
        ],
        { session }
      );

      ledgerEntries.push(ledger);
      consumed.push({
        batchNumber: bucket.batchNumber || '',
        heatNumber: bucket.heatNumber || '',
        lotNumber: bucket.lotNumber || '',
        rack: bucket.rack || '',
        qty: take,
        unitCost,
      });
      totalCost += take * unitCost;
      left -= take;
    }

    if (left > 0 && !input.allowNegative) {
      throw AppError.badRequest(`Could not fully issue stock for ${material.code}. Short by ${left}`);
    }

    return { ledgerEntries, totalCost, consumed };
  }

  async getAvailableQty(materialId: string, warehouseId?: string): Promise<number> {
    const match: Record<string, unknown> = { material: new Types.ObjectId(materialId) };
    if (warehouseId) match.warehouse = new Types.ObjectId(warehouseId);

    const result = await StockBalance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          qty: { $sum: '$qty' },
          reserved: { $sum: '$reservedQty' },
        },
      },
    ]);

    if (!result.length) return 0;
    return Math.max(0, result[0].qty - result[0].reserved);
  }

  async getStockLedger(filters: {
    material?: string;
    warehouse?: string;
    productionOrder?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const query: Record<string, unknown> = {};
    if (filters.material) query.material = filters.material;
    if (filters.warehouse) query.warehouse = filters.warehouse;
    if (filters.productionOrder) query.productionOrder = filters.productionOrder;
    if (filters.from || filters.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.$gte = filters.from;
      if (filters.to) dateFilter.$lte = filters.to;
      query.transactionDate = dateFilter;
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, totalItems] = await Promise.all([
      StockLedger.find(query)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('material', 'code name uom')
        .populate('warehouse', 'code name')
        .populate('productionOrder', 'orderNumber')
        .populate('operator', 'firstName lastName employeeCode')
        .lean(),
      StockLedger.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 0,
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
    };
  }

  async withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export const stockService = new StockService();
export default stockService;

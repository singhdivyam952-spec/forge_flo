import { Types } from 'mongoose';
import { ProductionOrder, IProductionOrder } from '../models/ProductionOrder';
import { Routing } from '../models/Routing';
import { BOM } from '../models/BOM';
import { ShopFloorEntry } from '../models/ShopFloorEntry';
import { generateDocumentNumber } from '../utils/documentNumber';
import { AppError } from '../utils/AppError';
import { stockService } from './StockService';
import { materialTrackingService } from './MaterialTrackingService';

export class ProductionOrderService {
  async create(input: {
    material: string;
    qty: number;
    uom: string;
    salesOrder?: string;
    productionPlan?: string;
    bom?: string;
    routing?: string;
    sourceWarehouse?: string;
    targetWarehouse?: string;
    plannedStart?: Date;
    plannedEnd?: Date;
    priority?: string;
    remarks?: string;
    userId: string;
  }): Promise<IProductionOrder> {
    const orderNumber = await generateDocumentNumber({ prefix: 'PRD' });

    let operations: IProductionOrder['operations'] = [];
    const routingId = input.routing;
    if (routingId) {
      const routing = await Routing.findById(routingId);
      if (routing) {
        operations = routing.operations.map((op) => ({
          seq: op.seq,
          operationName: op.operationName || op.processType,
          processType: op.processType,
          workCenter: op.workCenter,
          machine: undefined,
          operators: [],
          status: 'Pending' as const,
          qtyCompleted: 0,
          qtyRejected: 0,
          scrapQty: 0,
          setupTime: op.setupTime,
          runTimePerUnit: op.runTimePerUnit,
        }));
      }
    }

    let bomId = input.bom;
    if (!bomId) {
      const bom = await BOM.findOne({ finishedMaterial: input.material, status: 'Approved' }).sort({ version: -1 });
      if (bom) bomId = String(bom._id);
    }

    return ProductionOrder.create({
      orderNumber,
      material: input.material,
      qty: input.qty,
      uom: input.uom,
      salesOrder: input.salesOrder,
      productionPlan: input.productionPlan,
      bom: bomId,
      routing: routingId,
      sourceWarehouse: input.sourceWarehouse,
      targetWarehouse: input.targetWarehouse,
      plannedStart: input.plannedStart,
      plannedEnd: input.plannedEnd,
      priority: input.priority || 'Medium',
      status: 'Planned',
      materialSummary: { issued: 0, consumed: 0, returned: 0, scrap: 0, balance: 0 },
      costSummary: { materialCost: 0, laborCost: 0, machineCost: 0, overhead: 0, totalCost: 0, unitCost: 0 },
      yieldPercent: 0,
      scrapPercent: 0,
      recoveryPercent: 0,
      qtyCompleted: 0,
      qtyRejected: 0,
      qtyScrap: 0,
      operations,
      remarks: input.remarks,
      createdBy: input.userId,
      updatedBy: input.userId,
    });
  }

  async release(id: string, userId: string) {
    const po = await ProductionOrder.findById(id);
    if (!po) throw AppError.notFound('Production order not found');
    if (!['Planned', 'OnHold'].includes(po.status)) {
      throw AppError.badRequest(`Cannot release order in status ${po.status}`);
    }
    po.status = 'Released';
    po.updatedBy = new Types.ObjectId(userId);
    await po.save();
    return po;
  }

  async start(id: string, userId: string) {
    const po = await ProductionOrder.findById(id);
    if (!po) throw AppError.notFound('Production order not found');
    if (!['Released', 'OnHold'].includes(po.status)) {
      throw AppError.badRequest(`Cannot start order in status ${po.status}`);
    }
    po.status = 'InProgress';
    po.actualStart = po.actualStart || new Date();
    po.updatedBy = new Types.ObjectId(userId);
    if (po.operations[0] && po.operations[0].status === 'Pending') {
      po.operations[0].status = 'InProgress';
      po.operations[0].actualStart = new Date();
    }
    await po.save();
    return po;
  }

  async logShopFloor(input: {
    productionOrder: string;
    operationSeq: number;
    qtyCompleted: number;
    qtyRejected?: number;
    scrapQty?: number;
    machine?: string;
    operator?: string;
    shift?: string;
    startTime?: Date;
    endTime?: Date;
    remarks?: string;
    userId: string;
  }) {
    return stockService.withTransaction(async (session) => {
      const po = await ProductionOrder.findById(input.productionOrder).session(session);
      if (!po) throw AppError.notFound('Production order not found');
      if (!['Released', 'InProgress'].includes(po.status)) {
        throw AppError.badRequest('Production order is not active');
      }

      const op = po.operations.find((o) => o.seq === input.operationSeq);
      if (!op) throw AppError.badRequest(`Operation seq ${input.operationSeq} not found`);

      const [entry] = await ShopFloorEntry.create(
        [
          {
            productionOrder: po._id,
            operationSeq: input.operationSeq,
            machine: input.machine,
            operator: input.operator || input.userId,
            shift: input.shift,
            qtyCompleted: input.qtyCompleted,
            qtyRejected: input.qtyRejected || 0,
            scrapQty: input.scrapQty || 0,
            startTime: input.startTime || new Date(),
            endTime: input.endTime || new Date(),
            remarks: input.remarks,
            createdBy: input.userId,
          },
        ],
        { session }
      );

      op.qtyCompleted += input.qtyCompleted;
      op.qtyRejected += input.qtyRejected || 0;
      op.scrapQty += input.scrapQty || 0;
      if (input.machine) op.machine = new Types.ObjectId(input.machine);
      if (input.operator) {
        const oid = new Types.ObjectId(input.operator);
        if (!op.operators.some((o) => String(o) === String(oid))) op.operators.push(oid);
      }
      if (op.status === 'Pending' || op.status === 'Released') {
        op.status = 'InProgress';
        op.actualStart = op.actualStart || new Date();
      }

      po.qtyCompleted = po.operations.reduce((s, o) => Math.max(s, o.qtyCompleted), 0);
      // Prefer last operation completed qty as FG output
      const lastOp = [...po.operations].sort((a, b) => b.seq - a.seq)[0];
      if (lastOp) po.qtyCompleted = lastOp.qtyCompleted;

      po.qtyRejected += input.qtyRejected || 0;
      po.status = 'InProgress';
      if (!po.actualStart) po.actualStart = new Date();
      po.updatedBy = new Types.ObjectId(input.userId);
      await po.save({ session });

      await materialTrackingService.recalculateProductionYield(String(po._id), session);
      return { entry, productionOrder: po };
    });
  }

  async completeOperation(id: string, operationSeq: number, userId: string) {
    const po = await ProductionOrder.findById(id);
    if (!po) throw AppError.notFound('Production order not found');
    const op = po.operations.find((o) => o.seq === operationSeq);
    if (!op) throw AppError.badRequest('Operation not found');
    op.status = 'Completed';
    op.actualEnd = new Date();
    po.updatedBy = new Types.ObjectId(userId);
    await po.save();
    return po;
  }

  async completeOrder(id: string, userId: string) {
    return stockService.withTransaction(async (session) => {
      const po = await ProductionOrder.findById(id).session(session);
      if (!po) throw AppError.notFound('Production order not found');
      if (po.status === 'Completed' || po.status === 'Closed') {
        throw AppError.conflict('Order already completed');
      }

      po.status = 'Completed';
      po.actualEnd = new Date();
      po.updatedBy = new Types.ObjectId(userId);

      // Receipt finished goods into target warehouse
      if (po.targetWarehouse && po.qtyCompleted > 0) {
        await stockService.postIn(
          {
            material: po.material,
            warehouse: po.targetWarehouse,
            qty: po.qtyCompleted,
            uom: po.uom,
            unitCost: po.costSummary.unitCost || 0,
            voucherType: 'ProductionReceipt',
            voucherNumber: po.orderNumber,
            voucherId: po._id,
            productionOrder: po._id,
            createdBy: userId,
            remarks: 'FG receipt from production order completion',
          },
          session
        );
      }

      await po.save({ session });
      await materialTrackingService.recalculateProductionYield(String(po._id), session);
      return po;
    });
  }

  async getTraceability(id: string) {
    const po = await ProductionOrder.findById(id)
      .populate('material', 'code name uom type')
      .populate('salesOrder', 'orderNumber')
      .populate('bom')
      .populate('routing')
      .lean();
    if (!po) throw AppError.notFound('Production order not found');

    const [issues, returns, consumptions, scraps, ledger, shopFloor] = await Promise.all([
      (await import('../models/MaterialIssue')).MaterialIssue.find({ productionOrder: id })
        .populate('lines.material', 'code name')
        .lean(),
      (await import('../models/MaterialReturn')).MaterialReturn.find({ productionOrder: id }).lean(),
      (await import('../models/MaterialConsumption')).MaterialConsumption.find({ productionOrder: id })
        .populate('material', 'code name')
        .lean(),
      (await import('../models/Scrap')).Scrap.find({ productionOrder: id }).lean(),
      (await import('../models/StockLedger')).StockLedger.find({ productionOrder: id })
        .sort({ transactionDate: 1 })
        .populate('material', 'code name')
        .lean(),
      ShopFloorEntry.find({ productionOrder: id }).sort({ startTime: 1 }).lean(),
    ]);

    return {
      productionOrder: po,
      materialFlow: {
        issued: po.materialSummary,
        yieldPercent: po.yieldPercent,
        scrapPercent: po.scrapPercent,
        recoveryPercent: po.recoveryPercent,
      },
      issues,
      returns,
      consumptions,
      scraps,
      stockLedger: ledger,
      shopFloor,
    };
  }
}

export const productionOrderService = new ProductionOrderService();
export default productionOrderService;

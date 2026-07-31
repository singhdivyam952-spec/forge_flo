import { Types } from 'mongoose';
import { Scrap, IScrap } from '../models/Scrap';
import { MaterialConsumption } from '../models/MaterialConsumption';
import { ProductionOrder } from '../models/ProductionOrder';
import { Warehouse } from '../models/Warehouse';
import { generateDocumentNumber } from '../utils/documentNumber';
import { AppError } from '../utils/AppError';
import { stockService } from './StockService';
import { materialTrackingService } from './MaterialTrackingService';

export class ScrapService {
  async create(input: {
    scrapType: string;
    material: string;
    productionOrder?: string;
    weight?: number;
    length?: number;
    reason?: string;
    operator?: string;
    machine?: string;
    shift?: string;
    recoveredMaterial?: string;
    recoveredQty?: number;
    recoveredUom?: string;
    saleValue?: number;
    disposalMethod?: string;
    warehouse?: string;
    operationSeq?: number;
    remarks?: string;
    userId: string;
  }): Promise<IScrap> {
    return stockService.withTransaction(async (session) => {
      const scrapNumber = await generateDocumentNumber({ prefix: 'SCR' });
      const scrapQty = input.weight ?? input.recoveredQty ?? 0;

      const [scrap] = await Scrap.create(
        [
          {
            scrapNumber,
            scrapType: input.scrapType,
            material: input.material,
            productionOrder: input.productionOrder,
            weight: input.weight,
            length: input.length,
            reason: input.reason,
            operator: input.operator,
            machine: input.machine,
            shift: input.shift,
            recoveredMaterial: input.recoveredMaterial,
            recoveredQty: input.recoveredQty ?? 0,
            recoveredUom: input.recoveredUom,
            saleValue: input.saleValue ?? 0,
            disposalMethod: input.disposalMethod,
            warehouse: input.warehouse,
            operationSeq: input.operationSeq,
            scrapDate: new Date(),
            status: 'Generated',
            remarks: input.remarks,
            createdBy: input.userId,
          },
        ],
        { session }
      );

      if (input.productionOrder && scrapQty > 0) {
        await MaterialConsumption.findOneAndUpdate(
          { productionOrder: input.productionOrder, material: input.material, qtyBalance: { $gt: 0 } },
          { $inc: { qtyScrap: scrapQty, qtyBalance: -scrapQty } },
          { session, sort: { createdAt: 1 } }
        );

        await ProductionOrder.findByIdAndUpdate(
          input.productionOrder,
          {
            $inc: {
              'materialSummary.scrap': scrapQty,
              'materialSummary.balance': -scrapQty,
              qtyScrap: scrapQty,
            },
          },
          { session }
        );
      }

      // Recover scrap into scrap warehouse / recovered material stock
      if (input.recoveredMaterial && (input.recoveredQty ?? 0) > 0) {
        let warehouseId = input.warehouse;
        if (!warehouseId) {
          const scrapWh = await Warehouse.findOne({ type: 'Scrap', isActive: { $ne: false } }).session(session);
          warehouseId = scrapWh ? String(scrapWh._id) : undefined;
        }

        if (warehouseId) {
          await stockService.postIn(
            {
              material: input.recoveredMaterial,
              warehouse: warehouseId,
              qty: input.recoveredQty!,
              uom: input.recoveredUom || 'KG',
              unitCost: 0,
              voucherType: 'Scrap',
              voucherNumber: scrapNumber,
              voucherId: scrap._id,
              productionOrder: input.productionOrder,
              machine: input.machine,
              operator: input.operator,
              shift: input.shift,
              remarks: `Scrap recovery: ${input.reason || ''}`,
              createdBy: input.userId,
            },
            session
          );
          scrap.status = 'ReturnedToStock';
          await scrap.save({ session });
        }

        if (input.productionOrder) {
          const po = await ProductionOrder.findById(input.productionOrder).session(session);
          if (po) {
            const issued = po.materialSummary.issued || 0;
            const recovered = (input.recoveredQty || 0);
            const prevRecoveredWeight = ((po.recoveryPercent || 0) / 100) * issued;
            const newRecovered = prevRecoveredWeight + recovered;
            po.recoveryPercent = issued > 0 ? Number(((newRecovered / issued) * 100).toFixed(2)) : 0;
            await po.save({ session });
          }
        }
      }

      if (input.productionOrder) {
        const po = await ProductionOrder.findById(input.productionOrder).session(session);
        if (po && po.materialSummary.issued > 0) {
          scrap.scrapPercentContribution = Number(
            ((scrapQty / po.materialSummary.issued) * 100).toFixed(2)
          );
          await scrap.save({ session });
        }
        await materialTrackingService.recalculateProductionYield(input.productionOrder, session);
      }

      return scrap;
    });
  }

  async dispose(scrapId: string, input: { disposalMethod: string; saleValue?: number; userId: string }) {
    const scrap = await Scrap.findById(scrapId);
    if (!scrap) throw AppError.notFound('Scrap record not found');

    scrap.disposalMethod = input.disposalMethod as never;
    if (input.saleValue !== undefined) scrap.saleValue = input.saleValue;
    scrap.status = input.disposalMethod === 'Sale' ? 'Sold' : 'Disposed';
    scrap.updatedBy = new Types.ObjectId(input.userId);
    await scrap.save();
    return scrap;
  }

  async getDashboard(from?: Date, to?: Date) {
    const match: Record<string, unknown> = {};
    if (from || to) {
      match.scrapDate = {};
      if (from) (match.scrapDate as Record<string, Date>).$gte = from;
      if (to) (match.scrapDate as Record<string, Date>).$lte = to;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const [totals, today, monthly, byType, byReason] = await Promise.all([
      Scrap.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalWeight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } },
            totalSaleValue: { $sum: '$saleValue' },
            totalRecovered: { $sum: '$recoveredQty' },
            count: { $sum: 1 },
          },
        },
      ]),
      Scrap.aggregate([
        { $match: { scrapDate: { $gte: startOfToday } } },
        { $group: { _id: null, weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } }, count: { $sum: 1 } } },
      ]),
      Scrap.aggregate([
        { $match: { scrapDate: { $gte: startOfMonth } } },
        { $group: { _id: null, weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } }, count: { $sum: 1 } } },
      ]),
      Scrap.aggregate([
        { $match: match },
        { $group: { _id: '$scrapType', weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } }, count: { $sum: 1 } } },
        { $sort: { weight: -1 } },
      ]),
      Scrap.aggregate([
        { $match: match },
        { $group: { _id: '$reason', weight: { $sum: { $ifNull: ['$weight', '$recoveredQty'] } }, count: { $sum: 1 } } },
        { $sort: { weight: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const poAgg = await ProductionOrder.aggregate([
      {
        $group: {
          _id: null,
          issued: { $sum: '$materialSummary.issued' },
          scrap: { $sum: '$materialSummary.scrap' },
          completed: { $sum: '$qtyCompleted' },
          avgYield: { $avg: '$yieldPercent' },
          avgRecovery: { $avg: '$recoveryPercent' },
          avgScrap: { $avg: '$scrapPercent' },
        },
      },
    ]);

    const t = totals[0] || { totalWeight: 0, totalSaleValue: 0, totalRecovered: 0, count: 0 };
    const po = poAgg[0] || { issued: 0, scrap: 0, completed: 0, avgYield: 0, avgRecovery: 0, avgScrap: 0 };

    return {
      totalScrap: t.totalWeight,
      scrapCount: t.count,
      totalSaleValue: t.totalSaleValue,
      totalRecovered: t.totalRecovered,
      dailyScrap: today[0]?.weight ?? 0,
      dailyCount: today[0]?.count ?? 0,
      monthlyScrap: monthly[0]?.weight ?? 0,
      monthlyCount: monthly[0]?.count ?? 0,
      scrapPercent: po.issued > 0 ? Number(((po.scrap / po.issued) * 100).toFixed(2)) : po.avgScrap || 0,
      yieldPercent: Number((po.avgYield || 0).toFixed(2)),
      recoveryPercent: Number((po.avgRecovery || 0).toFixed(2)),
      byType,
      byReason,
    };
  }
}

export const scrapService = new ScrapService();
export default scrapService;

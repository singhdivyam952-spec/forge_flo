import { Types, ClientSession } from 'mongoose';
import { MaterialIssue, IMaterialIssue } from '../models/MaterialIssue';
import { MaterialReturn } from '../models/MaterialReturn';
import { MaterialConsumption } from '../models/MaterialConsumption';
import { ProductionOrder } from '../models/ProductionOrder';
import { MaterialRequisition } from '../models/MaterialRequisition';
import { generateDocumentNumber } from '../utils/documentNumber';
import { AppError } from '../utils/AppError';
import { stockService } from './StockService';

export interface IssueLineInput {
  material: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  rack?: string;
  qty: number;
  uom: string;
}

export class MaterialTrackingService {
  async createIssue(input: {
    productionOrder?: string;
    requisition?: string;
    warehouse: string;
    lines: IssueLineInput[];
    remarks?: string;
    postImmediately?: boolean;
    userId: string;
  }): Promise<IMaterialIssue> {
    if (!input.lines?.length) throw AppError.badRequest('At least one issue line is required');

    const issueNumber = await generateDocumentNumber({ prefix: 'MI' });

    const issue = await MaterialIssue.create({
      issueNumber,
      productionOrder: input.productionOrder,
      requisition: input.requisition,
      warehouse: input.warehouse,
      lines: input.lines.map((l) => ({ ...l, unitCost: 0, totalValue: 0 })),
      issueDate: new Date(),
      issuedBy: input.userId,
      status: 'Draft',
      remarks: input.remarks,
      createdBy: input.userId,
      updatedBy: input.userId,
    });

    if (input.postImmediately) {
      return this.postIssue(String(issue._id), input.userId);
    }
    return issue;
  }

  async postIssue(issueId: string, userId: string): Promise<IMaterialIssue> {
    return stockService.withTransaction(async (session) => {
      const issue = await MaterialIssue.findById(issueId).session(session);
      if (!issue) throw AppError.notFound('Material issue not found');
      if (issue.status === 'Issued') throw AppError.conflict('Issue already posted');
      if (issue.status === 'Cancelled') throw AppError.badRequest('Cannot post a cancelled issue');

      let totalIssued = 0;
      let totalMaterialCost = 0;

      for (const line of issue.lines) {
        const result = await stockService.postOut(
          {
            material: line.material,
            warehouse: issue.warehouse,
            rack: line.rack,
            batchNumber: line.batchNumber,
            heatNumber: line.heatNumber,
            lotNumber: line.lotNumber,
            qty: line.qty,
            uom: line.uom,
            voucherType: 'MaterialIssue',
            voucherNumber: issue.issueNumber,
            voucherId: issue._id,
            productionOrder: issue.productionOrder,
            remarks: issue.remarks,
            createdBy: userId,
          },
          session
        );

        const avgCost = line.qty > 0 ? result.totalCost / line.qty : 0;
        line.unitCost = avgCost;
        line.totalValue = result.totalCost;
        if (result.consumed[0]) {
          line.batchNumber = result.consumed[0].batchNumber || line.batchNumber;
          line.heatNumber = result.consumed[0].heatNumber || line.heatNumber;
          line.lotNumber = result.consumed[0].lotNumber || line.lotNumber;
          line.rack = result.consumed[0].rack || line.rack;
        }

        totalIssued += line.qty;
        totalMaterialCost += result.totalCost;

        if (issue.productionOrder) {
          await MaterialConsumption.create(
            [
              {
                productionOrder: issue.productionOrder,
                materialIssue: issue._id,
                material: line.material,
                batchNumber: line.batchNumber,
                heatNumber: line.heatNumber,
                lotNumber: line.lotNumber,
                qtyIssued: line.qty,
                qtyConsumed: 0,
                qtyReturned: 0,
                qtyScrap: 0,
                qtyBalance: line.qty,
                uom: line.uom,
                consumptionDate: new Date(),
                createdBy: userId,
              },
            ],
            { session }
          );
        }
      }

      issue.status = 'Issued';
      issue.issuedBy = new Types.ObjectId(userId);
      issue.updatedBy = new Types.ObjectId(userId);
      await issue.save({ session });

      if (issue.productionOrder) {
        await ProductionOrder.findByIdAndUpdate(
          issue.productionOrder,
          {
            $inc: {
              'materialSummary.issued': totalIssued,
              'materialSummary.balance': totalIssued,
              'costSummary.materialCost': totalMaterialCost,
            },
            $set: { updatedBy: userId },
          },
          { session }
        );
      }

      if (issue.requisition) {
        await MaterialRequisition.findByIdAndUpdate(
          issue.requisition,
          { $set: { status: 'Issued', updatedBy: userId } },
          { session }
        );
      }

      return issue;
    });
  }

  async createAndPostReturn(input: {
    productionOrder?: string;
    materialIssue?: string;
    warehouse: string;
    lines: IssueLineInput[];
    remarks?: string;
    userId: string;
  }) {
    return stockService.withTransaction(async (session) => {
      const returnNumber = await generateDocumentNumber({ prefix: 'MR' });

      const [ret] = await MaterialReturn.create(
        [
          {
            returnNumber,
            productionOrder: input.productionOrder,
            materialIssue: input.materialIssue,
            warehouse: input.warehouse,
            lines: input.lines.map((l) => ({ ...l, unitCost: 0, totalValue: 0 })),
            returnDate: new Date(),
            returnedBy: input.userId,
            status: 'Returned',
            remarks: input.remarks,
            createdBy: input.userId,
          },
        ],
        { session }
      );

      let totalReturned = 0;

      for (const line of ret.lines) {
        const { balance } = await stockService.postIn(
          {
            material: line.material,
            warehouse: input.warehouse,
            rack: line.rack,
            batchNumber: line.batchNumber,
            heatNumber: line.heatNumber,
            lotNumber: line.lotNumber,
            qty: line.qty,
            uom: line.uom,
            voucherType: 'MaterialReturn',
            voucherNumber: returnNumber,
            voucherId: ret._id,
            productionOrder: input.productionOrder,
            remarks: input.remarks,
            createdBy: input.userId,
          },
          session
        );

        line.unitCost = balance.unitCost;
        line.totalValue = line.qty * balance.unitCost;
        totalReturned += line.qty;

        if (input.productionOrder) {
          await MaterialConsumption.findOneAndUpdate(
            {
              productionOrder: input.productionOrder,
              material: line.material,
              ...(input.materialIssue ? { materialIssue: input.materialIssue } : {}),
            },
            { $inc: { qtyReturned: line.qty, qtyBalance: -line.qty } },
            { session, sort: { createdAt: -1 } }
          );
        }
      }

      await ret.save({ session });

      if (input.productionOrder) {
        await ProductionOrder.findByIdAndUpdate(
          input.productionOrder,
          {
            $inc: {
              'materialSummary.returned': totalReturned,
              'materialSummary.balance': -totalReturned,
            },
          },
          { session }
        );
        await this.recalculateProductionYield(String(input.productionOrder), session);
      }

      return ret;
    });
  }

  async recordConsumption(input: {
    productionOrder: string;
    material: string;
    qtyConsumed: number;
    machine?: string;
    operator?: string;
    shift?: string;
    userId: string;
  }) {
    return stockService.withTransaction(async (session) => {
      const consumption = await MaterialConsumption.findOne({
        productionOrder: input.productionOrder,
        material: input.material,
        qtyBalance: { $gt: 0 },
      })
        .sort({ createdAt: 1 })
        .session(session);

      if (!consumption) {
        throw AppError.badRequest('No issued balance available for this material on the production order');
      }
      if (consumption.qtyBalance < input.qtyConsumed) {
        throw AppError.badRequest(`Consumption ${input.qtyConsumed} exceeds balance ${consumption.qtyBalance}`);
      }

      consumption.qtyConsumed += input.qtyConsumed;
      consumption.qtyBalance -= input.qtyConsumed;
      if (input.machine) consumption.machine = new Types.ObjectId(input.machine);
      if (input.operator) consumption.operator = new Types.ObjectId(input.operator);
      if (input.shift) consumption.shift = new Types.ObjectId(input.shift);
      await consumption.save({ session });

      // Store stock already reduced at issue time — update PO aggregates only.
      await ProductionOrder.findByIdAndUpdate(
        input.productionOrder,
        {
          $inc: {
            'materialSummary.consumed': input.qtyConsumed,
            'materialSummary.balance': -input.qtyConsumed,
          },
        },
        { session }
      );

      await this.recalculateProductionYield(input.productionOrder, session);
      return consumption;
    });
  }

  async recalculateProductionYield(productionOrderId: string, session?: ClientSession) {
    const po = await ProductionOrder.findById(productionOrderId).session(session ?? null);
    if (!po) return;

    const issued = po.materialSummary.issued || 0;
    const scrap = po.materialSummary.scrap || 0;
    const goodOutput = po.qtyCompleted || 0;
    const inputBase = issued > 0 ? issued : po.materialSummary.consumed + scrap;

    po.scrapPercent = inputBase > 0 ? Number(((scrap / inputBase) * 100).toFixed(2)) : 0;
    po.yieldPercent = inputBase > 0 ? Number(((goodOutput / inputBase) * 100).toFixed(2)) : 0;

    const totalCost =
      (po.costSummary.materialCost || 0) +
      (po.costSummary.laborCost || 0) +
      (po.costSummary.machineCost || 0) +
      (po.costSummary.overhead || 0);
    po.costSummary.totalCost = totalCost;
    po.costSummary.unitCost = goodOutput > 0 ? Number((totalCost / goodOutput).toFixed(4)) : 0;

    await po.save({ session });
  }
}

export const materialTrackingService = new MaterialTrackingService();
export default materialTrackingService;

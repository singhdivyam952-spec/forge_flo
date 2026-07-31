import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const PRODUCTION_ORDER_STATUSES = [
  'Planned',
  'Released',
  'InProgress',
  'OnHold',
  'Completed',
  'Closed',
  'Cancelled',
] as const;
export type ProductionOrderStatus = (typeof PRODUCTION_ORDER_STATUSES)[number];

export const PRODUCTION_ORDER_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type ProductionOrderPriority = (typeof PRODUCTION_ORDER_PRIORITIES)[number];

export const PO_OPERATION_STATUSES = ['Pending', 'Released', 'InProgress', 'Completed', 'Skipped'] as const;
export type PoOperationStatus = (typeof PO_OPERATION_STATUSES)[number];

/** Aggregated material movement snapshot for the order (kept in sync by MaterialConsumption postings). */
export interface IMaterialSummary {
  issued: number;
  consumed: number;
  returned: number;
  scrap: number;
  balance: number;
}

export interface ICostSummary {
  materialCost: number;
  laborCost: number;
  machineCost: number;
  overhead: number;
  totalCost: number;
  unitCost: number;
}

export interface IProductionOrderOperation {
  seq: number;
  operationName: string;
  processType: string;
  workCenter?: Types.ObjectId;
  machine?: Types.ObjectId;
  operators: Types.ObjectId[];
  status: PoOperationStatus;
  plannedStart?: Date;
  plannedEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  qtyCompleted: number;
  qtyRejected: number;
  scrapQty: number;
  setupTime?: number;
  runTimePerUnit?: number;
  remarks?: string;
}

export interface IProductionOrder extends Document, IAuditable, ISoftDeletable, ITimestamped {
  orderNumber: string;
  salesOrder?: Types.ObjectId;
  salesOrderItem?: Types.ObjectId;
  productionPlan?: Types.ObjectId;

  material: Types.ObjectId;
  qty: number;
  uom: string;

  bom?: Types.ObjectId;
  routing?: Types.ObjectId;

  sourceWarehouse?: Types.ObjectId;
  targetWarehouse?: Types.ObjectId;

  plannedStart?: Date;
  plannedEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;

  status: ProductionOrderStatus;
  priority: ProductionOrderPriority;

  materialSummary: IMaterialSummary;
  costSummary: ICostSummary;

  yieldPercent: number;
  scrapPercent: number;
  recoveryPercent: number;

  qtyCompleted: number;
  qtyRejected: number;
  qtyScrap: number;

  operations: IProductionOrderOperation[];

  remarks?: string;
}

const productionOrderOperationSchema = new Schema<IProductionOrderOperation>(
  {
    seq: { type: Number, required: true, min: 1 },
    operationName: { type: String, required: true, trim: true },
    processType: { type: String, trim: true },
    workCenter: { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: PO_OPERATION_STATUSES, default: 'Pending' },
    plannedStart: { type: Date },
    plannedEnd: { type: Date },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    qtyCompleted: { type: Number, default: 0, min: 0 },
    qtyRejected: { type: Number, default: 0, min: 0 },
    scrapQty: { type: Number, default: 0, min: 0 },
    setupTime: { type: Number, min: 0 },
    runTimePerUnit: { type: Number, min: 0 },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const materialSummarySchema = new Schema<IMaterialSummary>(
  {
    issued: { type: Number, default: 0 },
    consumed: { type: Number, default: 0 },
    returned: { type: Number, default: 0 },
    scrap: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
  },
  { _id: false }
);

const costSummarySchema = new Schema<ICostSummary>(
  {
    materialCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    machineCost: { type: Number, default: 0 },
    overhead: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    unitCost: { type: Number, default: 0 },
  },
  { _id: false }
);

const productionOrderSchema = new Schema<IProductionOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    salesOrder: { type: Schema.Types.ObjectId, ref: 'SalesOrder', index: true },
    salesOrderItem: { type: Schema.Types.ObjectId },
    productionPlan: { type: Schema.Types.ObjectId, ref: 'ProductionPlan' },

    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },

    bom: { type: Schema.Types.ObjectId, ref: 'BOM' },
    routing: { type: Schema.Types.ObjectId, ref: 'Routing' },

    sourceWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    targetWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },

    plannedStart: { type: Date },
    plannedEnd: { type: Date },
    actualStart: { type: Date },
    actualEnd: { type: Date },

    status: { type: String, enum: PRODUCTION_ORDER_STATUSES, default: 'Planned', index: true },
    priority: { type: String, enum: PRODUCTION_ORDER_PRIORITIES, default: 'Medium' },

    materialSummary: { type: materialSummarySchema, default: () => ({}) },
    costSummary: { type: costSummarySchema, default: () => ({}) },

    yieldPercent: { type: Number, default: 0, min: 0, max: 100 },
    scrapPercent: { type: Number, default: 0, min: 0, max: 100 },
    recoveryPercent: { type: Number, default: 0, min: 0, max: 100 },

    qtyCompleted: { type: Number, default: 0, min: 0 },
    qtyRejected: { type: Number, default: 0, min: 0 },
    qtyScrap: { type: Number, default: 0, min: 0 },

    operations: { type: [productionOrderOperationSchema], default: [] },

    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

productionOrderSchema.index({ status: 1, priority: 1 });
productionOrderSchema.index({ material: 1, status: 1 });
productionOrderSchema.index({ plannedStart: 1, plannedEnd: 1 });
productionOrderSchema.index({ 'operations.machine': 1 });
productionOrderSchema.index({ 'operations.operators': 1 });

export const ProductionOrder = model<IProductionOrder>('ProductionOrder', productionOrderSchema);
export default ProductionOrder;

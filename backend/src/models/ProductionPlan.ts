import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const PRODUCTION_PLAN_STATUSES = ['Draft', 'Approved', 'InProgress', 'Completed', 'Cancelled'] as const;
export type ProductionPlanStatus = (typeof PRODUCTION_PLAN_STATUSES)[number];

export const PLAN_ITEM_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type PlanItemPriority = (typeof PLAN_ITEM_PRIORITIES)[number];

export const PLAN_ITEM_STATUSES = ['Pending', 'Released', 'InProgress', 'Completed', 'Cancelled'] as const;
export type PlanItemStatus = (typeof PLAN_ITEM_STATUSES)[number];

export interface IProductionPlanItem {
  material: Types.ObjectId;
  salesOrder?: Types.ObjectId;
  qty: number;
  uom: string;
  priority: PlanItemPriority;
  plannedStart: Date;
  plannedEnd: Date;
  status: PlanItemStatus;
  productionOrder?: Types.ObjectId;
  remarks?: string;
}

export interface IProductionPlan extends Document, IAuditable, ISoftDeletable, ITimestamped {
  planNumber: string;
  planningPeriodFrom: Date;
  planningPeriodTo: Date;
  items: IProductionPlanItem[];
  status: ProductionPlanStatus;
  preparedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  remarks?: string;
}

const productionPlanItemSchema = new Schema<IProductionPlanItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    salesOrder: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    priority: { type: String, enum: PLAN_ITEM_PRIORITIES, default: 'Medium' },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    status: { type: String, enum: PLAN_ITEM_STATUSES, default: 'Pending' },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const productionPlanSchema = new Schema<IProductionPlan>(
  {
    planNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    planningPeriodFrom: { type: Date, required: true },
    planningPeriodTo: { type: Date, required: true },
    items: { type: [productionPlanItemSchema], default: [] },
    status: { type: String, enum: PRODUCTION_PLAN_STATUSES, default: 'Draft', index: true },
    preparedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

productionPlanSchema.index({ planningPeriodFrom: 1, planningPeriodTo: 1 });
productionPlanSchema.index({ 'items.material': 1 });
productionPlanSchema.index({ 'items.salesOrder': 1 });

export const ProductionPlan = model<IProductionPlan>('ProductionPlan', productionPlanSchema);
export default ProductionPlan;

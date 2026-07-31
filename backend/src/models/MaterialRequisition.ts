import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const REQUISITION_STATUSES = [
  'Draft',
  'Submitted',
  'Approved',
  'PartiallyIssued',
  'Issued',
  'Rejected',
  'Cancelled',
] as const;
export type RequisitionStatus = (typeof REQUISITION_STATUSES)[number];

export interface IRequisitionItem {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  warehouse?: Types.ObjectId;
  qtyIssued: number;
  purpose?: string;
  remarks?: string;
}

export interface IMaterialRequisition extends Document, IAuditable, ITimestamped {
  requisitionNumber: string;
  productionOrder?: Types.ObjectId;
  requestedBy: Types.ObjectId;
  department?: string;
  items: IRequisitionItem[];
  requiredDate?: Date;
  requisitionDate: Date;
  status: RequisitionStatus;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  remarks?: string;
}

const requisitionItemSchema = new Schema<IRequisitionItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    qtyIssued: { type: Number, default: 0, min: 0 },
    purpose: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const materialRequisitionSchema = new Schema<IMaterialRequisition>(
  {
    requisitionNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, trim: true },
    items: { type: [requisitionItemSchema], default: [] },
    requiredDate: { type: Date },
    requisitionDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: REQUISITION_STATUSES, default: 'Draft', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

materialRequisitionSchema.index({ status: 1, requisitionDate: -1 });
materialRequisitionSchema.index({ 'items.material': 1 });

export const MaterialRequisition = model<IMaterialRequisition>('MaterialRequisition', materialRequisitionSchema);
export default MaterialRequisition;

import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const COST_ESTIMATION_STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'] as const;
export type CostEstimationStatus = (typeof COST_ESTIMATION_STATUSES)[number];

export interface ICostEstimation extends Document, IAuditable, ISoftDeletable, ITimestamped {
  estimationNumber: string;
  rfq?: Types.ObjectId;
  material?: Types.ObjectId;
  partDescription?: string;
  bom?: Types.ObjectId;
  routing?: Types.ObjectId;
  qty: number;
  uom: string;

  materialCost: number;
  laborCost: number;
  machineCost: number;
  overheadCost: number;
  packingCost: number;
  freightCost: number;
  marginPercent: number;
  totalCost: number;
  unitCost: number;
  currency: string;

  status: CostEstimationStatus;
  preparedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  remarks?: string;
}

const costEstimationSchema = new Schema<ICostEstimation>(
  {
    estimationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    rfq: { type: Schema.Types.ObjectId, ref: 'RFQ' },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    partDescription: { type: String, trim: true },
    bom: { type: Schema.Types.ObjectId, ref: 'BOM' },
    routing: { type: Schema.Types.ObjectId, ref: 'Routing' },
    qty: { type: Number, default: 1, min: 0 },
    uom: { type: String, trim: true },

    materialCost: { type: Number, default: 0, min: 0 },
    laborCost: { type: Number, default: 0, min: 0 },
    machineCost: { type: Number, default: 0, min: 0 },
    overheadCost: { type: Number, default: 0, min: 0 },
    packingCost: { type: Number, default: 0, min: 0 },
    freightCost: { type: Number, default: 0, min: 0 },
    marginPercent: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },

    status: { type: String, enum: COST_ESTIMATION_STATUSES, default: 'Draft', index: true },
    preparedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

costEstimationSchema.index({ rfq: 1 });
costEstimationSchema.index({ material: 1, status: 1 });

export const CostEstimation = model<ICostEstimation>('CostEstimation', costEstimationSchema);
export default CostEstimation;

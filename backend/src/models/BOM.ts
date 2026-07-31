import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const BOM_STATUSES = ['Draft', 'UnderReview', 'Approved', 'Active', 'Obsolete'] as const;
export type BomStatus = (typeof BOM_STATUSES)[number];

export interface IBomItem {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  scrapPercent: number;
  process?: string;
  isCritical?: boolean;
  remarks?: string;
}

export interface IBOM extends Document, IAuditable, ISoftDeletable, ITimestamped {
  finishedMaterial: Types.ObjectId;
  version: string;
  baseQty: number;
  baseUom: string;
  items: IBomItem[];
  status: BomStatus;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
}

const bomItemSchema = new Schema<IBomItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    scrapPercent: { type: Number, default: 0, min: 0, max: 100 },
    process: { type: String, trim: true },
    isCritical: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const bomSchema = new Schema<IBOM>(
  {
    finishedMaterial: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    version: { type: String, required: true, trim: true },
    baseQty: { type: Number, default: 1, min: 0 },
    baseUom: { type: String, trim: true },
    items: { type: [bomItemSchema], default: [] },
    status: { type: String, enum: BOM_STATUSES, default: 'Draft', index: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

bomSchema.index({ finishedMaterial: 1, version: 1 }, { unique: true });
bomSchema.index({ finishedMaterial: 1, status: 1 });
bomSchema.index({ 'items.material': 1 });

export const BOM = model<IBOM>('BOM', bomSchema);
export default BOM;

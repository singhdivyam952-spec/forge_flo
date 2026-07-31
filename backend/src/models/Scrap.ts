import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const SCRAP_TYPES = ['Turning', 'Machining', 'Rejection', 'Trim', 'ProcessLoss', 'Other'] as const;
export type ScrapType = (typeof SCRAP_TYPES)[number];

export const SCRAP_DISPOSAL_METHODS = ['Sale', 'Recycle', 'Disposal', 'ReturnToStock'] as const;
export type ScrapDisposalMethod = (typeof SCRAP_DISPOSAL_METHODS)[number];

export const SCRAP_STATUSES = ['Generated', 'Segregated', 'Sold', 'Disposed', 'ReturnedToStock'] as const;
export type ScrapStatus = (typeof SCRAP_STATUSES)[number];

/**
 * CRITICAL model — tracks scrap generation for yield/recovery reporting and
 * downstream disposal / resale of scrap material.
 */
export interface IScrap extends Document, IAuditable, ITimestamped {
  scrapNumber: string;
  scrapType: ScrapType;

  productionOrder?: Types.ObjectId;
  material: Types.ObjectId;
  recoveredMaterial?: Types.ObjectId;
  recoveredQty: number;
  recoveredUom?: string;

  weight?: number;
  weightUom?: string;
  length?: number;
  lengthUom?: string;

  reason?: string;
  operator?: Types.ObjectId;
  machine?: Types.ObjectId;
  shift?: Types.ObjectId;
  operationSeq?: number;

  warehouse?: Types.ObjectId;
  scrapDate: Date;

  saleValue: number;
  disposalMethod?: ScrapDisposalMethod;
  status: ScrapStatus;
  scrapPercentContribution?: number;

  remarks?: string;
}

const scrapSchema = new Schema<IScrap>(
  {
    scrapNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    scrapType: { type: String, enum: SCRAP_TYPES, required: true, index: true },

    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    recoveredMaterial: { type: Schema.Types.ObjectId, ref: 'Material' },
    recoveredQty: { type: Number, default: 0, min: 0 },
    recoveredUom: { type: String, trim: true },

    weight: { type: Number, min: 0 },
    weightUom: { type: String, trim: true, default: 'kg' },
    length: { type: Number, min: 0 },
    lengthUom: { type: String, trim: true, default: 'mm' },

    reason: { type: String, trim: true },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    operationSeq: { type: Number },

    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    scrapDate: { type: Date, required: true, default: Date.now },

    saleValue: { type: Number, default: 0, min: 0 },
    disposalMethod: { type: String, enum: SCRAP_DISPOSAL_METHODS },
    status: { type: String, enum: SCRAP_STATUSES, default: 'Generated', index: true },
    scrapPercentContribution: { type: Number, min: 0, max: 100 },

    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

scrapSchema.index({ productionOrder: 1, scrapDate: -1 });
scrapSchema.index({ material: 1 });
scrapSchema.index({ machine: 1 });
scrapSchema.index({ status: 1, disposalMethod: 1 });

export const Scrap = model<IScrap>('Scrap', scrapSchema);
export default Scrap;

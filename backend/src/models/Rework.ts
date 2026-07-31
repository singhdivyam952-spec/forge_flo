import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const REWORK_STATUSES = ['Planned', 'InProgress', 'Completed', 'Scrapped'] as const;
export type ReworkStatus = (typeof REWORK_STATUSES)[number];

export interface IRework extends Document, IAuditable, ITimestamped {
  reworkNumber: string;
  productionOrder: Types.ObjectId;
  ncr?: Types.ObjectId;
  material: Types.ObjectId;
  qty: number;
  uom: string;
  reason: string;
  operationSeq?: number;
  machine?: Types.ObjectId;
  operator?: Types.ObjectId;
  shift?: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  status: ReworkStatus;
  resultQtyOk: number;
  resultQtyScrap: number;
  cost?: number;
  remarks?: string;
}

const reworkSchema = new Schema<IRework>(
  {
    reworkNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true, index: true },
    ncr: { type: Schema.Types.ObjectId, ref: 'NCR' },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    operationSeq: { type: Number },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: REWORK_STATUSES, default: 'Planned', index: true },
    resultQtyOk: { type: Number, default: 0, min: 0 },
    resultQtyScrap: { type: Number, default: 0, min: 0 },
    cost: { type: Number, min: 0 },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

reworkSchema.index({ productionOrder: 1, status: 1 });
reworkSchema.index({ material: 1 });

export const Rework = model<IRework>('Rework', reworkSchema);
export default Rework;

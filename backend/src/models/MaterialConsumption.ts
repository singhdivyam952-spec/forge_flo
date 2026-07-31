import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

/**
 * CRITICAL model — reconciles what was issued to a production order against
 * what was actually consumed, returned or scrapped on the shop floor.
 */
export interface IMaterialConsumption extends Document, IAuditable, ITimestamped {
  productionOrder: Types.ObjectId;
  materialIssue?: Types.ObjectId;
  material: Types.ObjectId;

  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;

  qtyIssued: number;
  qtyConsumed: number;
  qtyReturned: number;
  qtyScrap: number;
  qtyBalance: number;
  uom: string;

  machine?: Types.ObjectId;
  operator?: Types.ObjectId;
  shift?: Types.ObjectId;
  operationSeq?: number;

  consumptionDate: Date;
  remarks?: string;
}

const materialConsumptionSchema = new Schema<IMaterialConsumption>(
  {
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true, index: true },
    materialIssue: { type: Schema.Types.ObjectId, ref: 'MaterialIssue' },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true, index: true },

    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },

    qtyIssued: { type: Number, default: 0, min: 0 },
    qtyConsumed: { type: Number, default: 0, min: 0 },
    qtyReturned: { type: Number, default: 0, min: 0 },
    qtyScrap: { type: Number, default: 0, min: 0 },
    qtyBalance: { type: Number, default: 0 },
    uom: { type: String, required: true, trim: true },

    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    operationSeq: { type: Number },

    consumptionDate: { type: Date, required: true, default: Date.now },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

materialConsumptionSchema.index({ productionOrder: 1, material: 1 });
materialConsumptionSchema.index({ consumptionDate: -1 });
materialConsumptionSchema.index({ machine: 1 });
materialConsumptionSchema.index({ operator: 1 });

export const MaterialConsumption = model<IMaterialConsumption>('MaterialConsumption', materialConsumptionSchema);
export default MaterialConsumption;

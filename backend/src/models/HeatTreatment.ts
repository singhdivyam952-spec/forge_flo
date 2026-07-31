import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const HEAT_TREATMENT_TYPES = [
  'Annealing',
  'Hardening',
  'Tempering',
  'Normalizing',
  'CaseHardening',
  'Carburizing',
  'Nitriding',
  'StressRelieving',
  'Other',
] as const;
export type HeatTreatmentType = (typeof HEAT_TREATMENT_TYPES)[number];

export const HEAT_TREATMENT_STATUSES = ['Planned', 'InProcess', 'Completed', 'Failed'] as const;
export type HeatTreatmentStatus = (typeof HEAT_TREATMENT_STATUSES)[number];

export interface IHeatTreatment extends Document, IAuditable, ITimestamped {
  processNumber: string;
  productionOrder?: Types.ObjectId;
  material: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  qty: number;
  uom: string;

  treatmentType: HeatTreatmentType;
  machine?: Types.ObjectId;
  temperature?: number;
  temperatureUom?: string;
  durationMinutes?: number;

  startTime?: Date;
  endTime?: Date;
  operator?: Types.ObjectId;

  hardnessBefore?: string;
  hardnessAfter?: string;

  isOutsourced: boolean;
  vendor?: Types.ObjectId;

  status: HeatTreatmentStatus;
  remarks?: string;
}

const heatTreatmentSchema = new Schema<IHeatTreatment>(
  {
    processNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },

    treatmentType: { type: String, enum: HEAT_TREATMENT_TYPES, required: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    temperature: { type: Number },
    temperatureUom: { type: String, trim: true, default: 'C' },
    durationMinutes: { type: Number, min: 0 },

    startTime: { type: Date },
    endTime: { type: Date },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },

    hardnessBefore: { type: String, trim: true },
    hardnessAfter: { type: String, trim: true },

    isOutsourced: { type: Boolean, default: false },
    vendor: { type: Schema.Types.ObjectId, ref: 'Supplier' },

    status: { type: String, enum: HEAT_TREATMENT_STATUSES, default: 'Planned', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

heatTreatmentSchema.index({ productionOrder: 1, status: 1 });
heatTreatmentSchema.index({ material: 1 });
heatTreatmentSchema.index({ heatNumber: 1 });

export const HeatTreatment = model<IHeatTreatment>('HeatTreatment', heatTreatmentSchema);
export default HeatTreatment;

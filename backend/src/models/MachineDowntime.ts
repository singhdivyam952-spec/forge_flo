import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const DOWNTIME_REASONS = [
  'Breakdown',
  'Maintenance',
  'SetupChange',
  'NoOperator',
  'NoMaterial',
  'PowerFailure',
  'ToolChange',
  'QualityHold',
  'Other',
] as const;
export type DowntimeReason = (typeof DOWNTIME_REASONS)[number];

export const DOWNTIME_STATUSES = ['Open', 'InProgress', 'Resolved'] as const;
export type DowntimeStatus = (typeof DOWNTIME_STATUSES)[number];

export interface IMachineDowntime extends Document, IAuditable, ITimestamped {
  machine: Types.ObjectId;
  productionOrder?: Types.ObjectId;
  shift?: Types.ObjectId;
  reasonCategory: DowntimeReason;
  reasonDetail?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  reportedBy?: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  status: DowntimeStatus;
  remarks?: string;
}

const machineDowntimeSchema = new Schema<IMachineDowntime>(
  {
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    reasonCategory: { type: String, enum: DOWNTIME_REASONS, required: true },
    reasonDetail: { type: String, trim: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationMinutes: { type: Number, min: 0 },
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: DOWNTIME_STATUSES, default: 'Open', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

machineDowntimeSchema.index({ machine: 1, startTime: -1 });
machineDowntimeSchema.index({ status: 1 });

export const MachineDowntime = model<IMachineDowntime>('MachineDowntime', machineDowntimeSchema);
export default MachineDowntime;

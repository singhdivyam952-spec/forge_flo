import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MACHINE_ALLOCATION_STATUSES = ['Planned', 'Active', 'Completed', 'Cancelled'] as const;
export type MachineAllocationStatus = (typeof MACHINE_ALLOCATION_STATUSES)[number];

export interface IMachineAllocation extends Document, IAuditable, ITimestamped {
  machine: Types.ObjectId;
  productionOrder: Types.ObjectId;
  operationSeq?: number;
  shift?: Types.ObjectId;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  status: MachineAllocationStatus;
  allottedBy?: Types.ObjectId;
  remarks?: string;
}

const machineAllocationSchema = new Schema<IMachineAllocation>(
  {
    machine: { type: Schema.Types.ObjectId, ref: 'Machine', required: true, index: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true, index: true },
    operationSeq: { type: Number },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    actualStart: { type: Date },
    actualEnd: { type: Date },
    status: { type: String, enum: MACHINE_ALLOCATION_STATUSES, default: 'Planned', index: true },
    allottedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

machineAllocationSchema.index({ machine: 1, plannedStart: 1, plannedEnd: 1 });
machineAllocationSchema.index({ productionOrder: 1, operationSeq: 1 });

export const MachineAllocation = model<IMachineAllocation>('MachineAllocation', machineAllocationSchema);
export default MachineAllocation;

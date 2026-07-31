import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const EMPLOYEE_ALLOCATION_STATUSES = ['Planned', 'Active', 'Completed', 'Cancelled'] as const;
export type EmployeeAllocationStatus = (typeof EMPLOYEE_ALLOCATION_STATUSES)[number];

export interface IEmployeeAllocation extends Document, IAuditable, ITimestamped {
  employee: Types.ObjectId;
  machine?: Types.ObjectId;
  workCenter?: Types.ObjectId;
  shift: Types.ObjectId;
  productionOrder?: Types.ObjectId;
  operationSeq?: number;
  date: Date;
  skillLevel?: string;
  status: EmployeeAllocationStatus;
  remarks?: string;
}

const employeeAllocationSchema = new Schema<IEmployeeAllocation>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    workCenter: { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    operationSeq: { type: Number },
    date: { type: Date, required: true, default: Date.now },
    skillLevel: { type: String, trim: true },
    status: { type: String, enum: EMPLOYEE_ALLOCATION_STATUSES, default: 'Planned', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

employeeAllocationSchema.index({ employee: 1, date: 1, shift: 1 });
employeeAllocationSchema.index({ productionOrder: 1 });

export const EmployeeAllocation = model<IEmployeeAllocation>('EmployeeAllocation', employeeAllocationSchema);
export default EmployeeAllocation;

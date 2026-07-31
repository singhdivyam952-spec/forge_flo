import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export interface IWorkCenter extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  department?: string;
  costCenter?: string;
  description?: string;
  capacityPerShift?: number;
  capacityUom?: string;
  hourlyOverheadRate?: number;
  incharge?: Types.ObjectId;
  isActive: boolean;
  remarks?: string;
}

const workCenterSchema = new Schema<IWorkCenter>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    costCenter: { type: String, trim: true },
    description: { type: String, trim: true },
    capacityPerShift: { type: Number, min: 0 },
    capacityUom: { type: String, trim: true },
    hourlyOverheadRate: { type: Number, min: 0, default: 0 },
    incharge: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true, index: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

workCenterSchema.index({ department: 1, isActive: 1 });

export const WorkCenter = model<IWorkCenter>('WorkCenter', workCenterSchema);
export default WorkCenter;

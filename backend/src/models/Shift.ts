import { Schema, model, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export interface IShift extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  isNightShift: boolean;
  isActive: boolean;
  remarks?: string;
}

const shiftSchema = new Schema<IShift>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    breakMinutes: { type: Number, default: 0, min: 0 },
    isNightShift: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

export const Shift = model<IShift>('Shift', shiftSchema);
export default Shift;

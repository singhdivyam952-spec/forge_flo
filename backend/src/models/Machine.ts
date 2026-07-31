import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const MACHINE_STATUSES = ['Available', 'Running', 'Breakdown', 'Maintenance', 'Idle'] as const;
export type MachineStatus = (typeof MACHINE_STATUSES)[number];

export const MACHINE_CATEGORIES = [
  'Lathe',
  'CNC',
  'VMC',
  'Milling',
  'Drilling',
  'Grinding',
  'Furnace',
  'Press',
  'Welding',
  'Inspection',
  'Other',
] as const;
export type MachineCategory = (typeof MACHINE_CATEGORIES)[number];

export interface IMachine extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  category: MachineCategory;
  workCenter?: Types.ObjectId;
  make?: string;
  /** Equipment model / series name (renamed to avoid clashing with Mongoose Document.model). */
  modelName?: string;
  serialNumber?: string;
  yearOfPurchase?: number;
  capacity?: number;
  capacityUom?: string;
  hourlyRate: number;
  setupTimeStandard?: number;
  specifications?: Map<string, string>;
  status: MachineStatus;
  isActive: boolean;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  remarks?: string;
}

const machineSchema = new Schema<IMachine>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: MACHINE_CATEGORIES, required: true },
    workCenter: { type: Schema.Types.ObjectId, ref: 'WorkCenter', index: true },
    make: { type: String, trim: true },
    modelName: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    yearOfPurchase: { type: Number },
    capacity: { type: Number, min: 0 },
    capacityUom: { type: String, trim: true },
    hourlyRate: { type: Number, default: 0, min: 0 },
    setupTimeStandard: { type: Number, min: 0 },
    specifications: { type: Map, of: String },
    status: { type: String, enum: MACHINE_STATUSES, default: 'Available', index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

machineSchema.index({ category: 1, status: 1 });
machineSchema.index({ workCenter: 1, isActive: 1 });

export const Machine = model<IMachine>('Machine', machineSchema);
export default Machine;

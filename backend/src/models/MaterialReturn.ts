import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MATERIAL_RETURN_STATUSES = ['Draft', 'Returned', 'Cancelled'] as const;
export type MaterialReturnStatus = (typeof MATERIAL_RETURN_STATUSES)[number];

export interface IMaterialReturnLine {
  material: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  rack?: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalValue: number;
  reason?: string;
}

export interface IMaterialReturn extends Document, IAuditable, ITimestamped {
  returnNumber: string;
  productionOrder?: Types.ObjectId;
  materialIssue?: Types.ObjectId;
  warehouse: Types.ObjectId;
  lines: IMaterialReturnLine[];
  returnDate: Date;
  returnedBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  status: MaterialReturnStatus;
  remarks?: string;
}

const materialReturnLineSchema = new Schema<IMaterialReturnLine>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    rack: { type: String, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
    reason: { type: String, trim: true },
  },
  { _id: true }
);

const materialReturnSchema = new Schema<IMaterialReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    materialIssue: { type: Schema.Types.ObjectId, ref: 'MaterialIssue' },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lines: { type: [materialReturnLineSchema], default: [] },
    returnDate: { type: Date, required: true, default: Date.now },
    returnedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: MATERIAL_RETURN_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

materialReturnSchema.index({ productionOrder: 1, returnDate: -1 });
materialReturnSchema.index({ 'lines.material': 1 });

export const MaterialReturn = model<IMaterialReturn>('MaterialReturn', materialReturnSchema);
export default MaterialReturn;

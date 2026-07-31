import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const PACKING_STATUSES = ['Draft', 'Packed', 'Dispatched', 'Cancelled'] as const;
export type PackingStatus = (typeof PACKING_STATUSES)[number];

export interface IPackingItem {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  packageType?: string;
  packageCount: number;
  weightPerPackage?: number;
  netWeight?: number;
  grossWeight?: number;
}

export interface IPacking extends Document, IAuditable, ITimestamped {
  packingNumber: string;
  salesOrder?: Types.ObjectId;
  productionOrder?: Types.ObjectId;
  items: IPackingItem[];
  packedBy?: Types.ObjectId;
  packingDate: Date;
  status: PackingStatus;
  totalPackages: number;
  totalWeight: number;
  weightUom: string;
  remarks?: string;
}

const packingItemSchema = new Schema<IPackingItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    packageType: { type: String, trim: true },
    packageCount: { type: Number, default: 1, min: 0 },
    weightPerPackage: { type: Number, min: 0 },
    netWeight: { type: Number, min: 0 },
    grossWeight: { type: Number, min: 0 },
  },
  { _id: true }
);

const packingSchema = new Schema<IPacking>(
  {
    packingNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    salesOrder: { type: Schema.Types.ObjectId, ref: 'SalesOrder', index: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    items: { type: [packingItemSchema], default: [] },
    packedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    packingDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: PACKING_STATUSES, default: 'Draft', index: true },
    totalPackages: { type: Number, default: 0, min: 0 },
    totalWeight: { type: Number, default: 0, min: 0 },
    weightUom: { type: String, default: 'kg' },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

packingSchema.index({ salesOrder: 1, status: 1 });
packingSchema.index({ 'items.material': 1 });

export const Packing = model<IPacking>('Packing', packingSchema);
export default Packing;

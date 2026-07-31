import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, addressSchema, IAddress, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const WAREHOUSE_TYPES = ['RM', 'FG', 'Scrap', 'WIP', 'Quarantine', 'Consumable', 'Tooling'] as const;
export type WarehouseType = (typeof WAREHOUSE_TYPES)[number];

export interface IRack {
  code: string;
  name?: string;
  capacity?: number;
  capacityUom?: string;
  isActive: boolean;
}

export interface IWarehouse extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  type: WarehouseType;
  address?: IAddress;
  racks: IRack[];
  incharge?: Types.ObjectId;
  allowNegativeStock: boolean;
  isActive: boolean;
  remarks?: string;
}

const rackSchema = new Schema<IRack>(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, trim: true },
    capacity: { type: Number, min: 0 },
    capacityUom: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const warehouseSchema = new Schema<IWarehouse>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: WAREHOUSE_TYPES, required: true, index: true },
    address: { type: addressSchema },
    racks: { type: [rackSchema], default: [] },
    incharge: { type: Schema.Types.ObjectId, ref: 'User' },
    allowNegativeStock: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

warehouseSchema.index({ type: 1, isActive: 1 });
warehouseSchema.index({ 'racks.code': 1 });

export const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);
export default Warehouse;

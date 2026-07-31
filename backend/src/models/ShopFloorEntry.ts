import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const SHOP_FLOOR_ENTRY_STATUSES = ['InProgress', 'Paused', 'Completed'] as const;
export type ShopFloorEntryStatus = (typeof SHOP_FLOOR_ENTRY_STATUSES)[number];

/** Real-time production logging captured directly from the shop floor. */
export interface IShopFloorEntry extends Document, IAuditable, ITimestamped {
  productionOrder: Types.ObjectId;
  operationSeq: number;
  machine?: Types.ObjectId;
  operator?: Types.ObjectId;
  shift?: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  qtyCompleted: number;
  qtyRejected: number;
  scrapQty: number;
  status: ShopFloorEntryStatus;
  remarks?: string;
}

const shopFloorEntrySchema = new Schema<IShopFloorEntry>(
  {
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', required: true, index: true },
    operationSeq: { type: Number, required: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    qtyCompleted: { type: Number, default: 0, min: 0 },
    qtyRejected: { type: Number, default: 0, min: 0 },
    scrapQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: SHOP_FLOOR_ENTRY_STATUSES, default: 'InProgress', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

shopFloorEntrySchema.index({ productionOrder: 1, operationSeq: 1, startTime: -1 });
shopFloorEntrySchema.index({ machine: 1, startTime: -1 });
shopFloorEntrySchema.index({ operator: 1, startTime: -1 });

export const ShopFloorEntry = model<IShopFloorEntry>('ShopFloorEntry', shopFloorEntrySchema);
export default ShopFloorEntry;

import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const STOCK_TRANSFER_STATUSES = ['Draft', 'InTransit', 'Received', 'Cancelled'] as const;
export type StockTransferStatus = (typeof STOCK_TRANSFER_STATUSES)[number];

export interface IStockTransferLine {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  fromRack?: string;
  toRack?: string;
  unitCost?: number;
  totalValue?: number;
}

export interface IStockTransfer extends Document, IAuditable, ITimestamped {
  transferNumber: string;
  fromWarehouse: Types.ObjectId;
  toWarehouse: Types.ObjectId;
  items: IStockTransferLine[];
  transferDate: Date;
  requestedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  receivedDate?: Date;
  status: StockTransferStatus;
  remarks?: string;
}

const stockTransferLineSchema = new Schema<IStockTransferLine>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    fromRack: { type: String, trim: true },
    toRack: { type: String, trim: true },
    unitCost: { type: Number, min: 0 },
    totalValue: { type: Number, min: 0 },
  },
  { _id: true }
);

const stockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fromWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: { type: [stockTransferLineSchema], default: [] },
    transferDate: { type: Date, required: true, default: Date.now },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedDate: { type: Date },
    status: { type: String, enum: STOCK_TRANSFER_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

stockTransferSchema.index({ fromWarehouse: 1, toWarehouse: 1, transferDate: -1 });
stockTransferSchema.index({ status: 1 });
stockTransferSchema.index({ 'items.material': 1 });

export const StockTransfer = model<IStockTransfer>('StockTransfer', stockTransferSchema);
export default StockTransfer;

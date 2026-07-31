import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const GRN_STATUSES = ['Draft', 'Received', 'Inspected', 'Accepted', 'Rejected', 'Closed'] as const;
export type GrnStatus = (typeof GRN_STATUSES)[number];

export const GRN_INSPECTION_STATUSES = ['Pending', 'Passed', 'Failed', 'PartiallyPassed'] as const;
export type GrnInspectionStatus = (typeof GRN_INSPECTION_STATUSES)[number];

export interface IGoodsReceiptItem {
  material: Types.ObjectId;
  poQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  unitCost: number;
  totalValue: number;
  inspectionStatus: GrnInspectionStatus;
}

export interface IGoodsReceipt extends Document, IAuditable, ITimestamped {
  grnNumber: string;
  purchaseOrder: Types.ObjectId;
  supplier: Types.ObjectId;
  warehouse: Types.ObjectId;
  items: IGoodsReceiptItem[];

  receivedDate: Date;
  receivedBy?: Types.ObjectId;

  invoiceNumber?: string;
  invoiceDate?: Date;
  challanNumber?: string;
  vehicleNumber?: string;

  inspectionStatus: GrnInspectionStatus;
  status: GrnStatus;
  remarks?: string;
}

const goodsReceiptItemSchema = new Schema<IGoodsReceiptItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    poQty: { type: Number, default: 0, min: 0 },
    receivedQty: { type: Number, required: true, min: 0 },
    acceptedQty: { type: Number, default: 0, min: 0 },
    rejectedQty: { type: Number, default: 0, min: 0 },
    uom: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
    inspectionStatus: { type: String, enum: GRN_INSPECTION_STATUSES, default: 'Pending' },
  },
  { _id: true }
);

const goodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    grnNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    items: { type: [goodsReceiptItemSchema], default: [] },

    receivedDate: { type: Date, required: true, default: Date.now },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    invoiceNumber: { type: String, trim: true },
    invoiceDate: { type: Date },
    challanNumber: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true },

    inspectionStatus: { type: String, enum: GRN_INSPECTION_STATUSES, default: 'Pending', index: true },
    status: { type: String, enum: GRN_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ supplier: 1, receivedDate: -1 });
goodsReceiptSchema.index({ 'items.material': 1 });
goodsReceiptSchema.index({ 'items.batchNumber': 1 });
goodsReceiptSchema.index({ 'items.heatNumber': 1 });

export const GoodsReceipt = model<IGoodsReceipt>('GoodsReceipt', goodsReceiptSchema);
export default GoodsReceipt;

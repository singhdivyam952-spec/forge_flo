import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, addressSchema, IAddress, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const PURCHASE_ORDER_STATUSES = [
  'Draft',
  'Sent',
  'Confirmed',
  'PartiallyReceived',
  'Received',
  'Closed',
  'Cancelled',
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export interface IPurchaseOrderItem {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  unitPrice: number;
  taxPercent: number;
  amount: number;
  deliveryDate?: Date;
  qtyReceived: number;
  qtyPending: number;
}

export interface IPurchaseOrder extends Document, IAuditable, ISoftDeletable, ITimestamped {
  poNumber: string;
  supplier: Types.ObjectId;
  items: IPurchaseOrderItem[];
  orderDate: Date;
  deliveryAddress?: IAddress;
  paymentTerms?: string;
  termsAndConditions?: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  currency: string;
  preparedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  remarks?: string;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    deliveryDate: { type: Date },
    qtyReceived: { type: Number, default: 0, min: 0 },
    qtyPending: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [purchaseOrderItemSchema], default: [] },
    orderDate: { type: Date, required: true, default: Date.now },
    deliveryAddress: { type: addressSchema },
    paymentTerms: { type: String, trim: true },
    termsAndConditions: { type: String, trim: true },
    status: { type: String, enum: PURCHASE_ORDER_STATUSES, default: 'Draft', index: true },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    preparedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ 'items.material': 1 });

export const PurchaseOrder = model<IPurchaseOrder>('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;

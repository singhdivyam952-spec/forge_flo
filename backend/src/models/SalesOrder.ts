import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, addressSchema, IAddress, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const SALES_ORDER_STATUSES = [
  'Draft',
  'Confirmed',
  'InProduction',
  'PartiallyDelivered',
  'Delivered',
  'Closed',
  'Cancelled',
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export interface IDeliveryScheduleItem {
  dueDate: Date;
  qty: number;
  status?: string;
  remarks?: string;
}

export interface ISalesOrderItem {
  material: Types.ObjectId;
  description?: string;
  qty: number;
  uom: string;
  unitPrice: number;
  taxPercent: number;
  amount: number;
  deliveryDate?: Date;
  qtyDelivered: number;
  qtyPending: number;
  drawing?: Types.ObjectId;
}

export interface ISalesOrder extends Document, IAuditable, ISoftDeletable, ITimestamped {
  soNumber: string;
  customer: Types.ObjectId;
  quotation?: Types.ObjectId;
  items: ISalesOrderItem[];
  orderDate: Date;
  requiredDate?: Date;
  poReferenceNumber?: string;
  poDate?: Date;
  poDocument?: Types.ObjectId;
  attachments: Types.ObjectId[];
  shippingAddress?: IAddress;
  billingAddress?: IAddress;
  paymentTerms?: string;
  status: SalesOrderStatus;
  totalAmount: number;
  currency: string;
  salesPerson?: Types.ObjectId;
  productionStatus?: string;
  dispatchStatus?: string;
  deliverySchedule: IDeliveryScheduleItem[];
  remarks?: string;
}

const deliveryScheduleSchema = new Schema<IDeliveryScheduleItem>(
  {
    dueDate: { type: Date, required: true },
    qty: { type: Number, required: true, min: 0 },
    status: { type: String, trim: true },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const salesOrderItemSchema = new Schema<ISalesOrderItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    description: { type: String, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    deliveryDate: { type: Date },
    qtyDelivered: { type: Number, default: 0, min: 0 },
    qtyPending: { type: Number, default: 0, min: 0 },
    drawing: { type: Schema.Types.ObjectId, ref: 'Drawing' },
  },
  { _id: true }
);

const salesOrderSchema = new Schema<ISalesOrder>(
  {
    soNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    items: { type: [salesOrderItemSchema], default: [] },
    orderDate: { type: Date, required: true, default: Date.now },
    requiredDate: { type: Date },
    poReferenceNumber: { type: String, trim: true },
    poDate: { type: Date },
    poDocument: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    shippingAddress: { type: addressSchema },
    billingAddress: { type: addressSchema },
    paymentTerms: { type: String, trim: true },
    status: { type: String, enum: SALES_ORDER_STATUSES, default: 'Draft', index: true },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    salesPerson: { type: Schema.Types.ObjectId, ref: 'User' },
    productionStatus: { type: String, trim: true, default: 'Pending', index: true },
    dispatchStatus: { type: String, trim: true, default: 'Pending', index: true },
    deliverySchedule: { type: [deliveryScheduleSchema], default: [] },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

salesOrderSchema.index({ customer: 1, status: 1 });
salesOrderSchema.index({ orderDate: -1 });
salesOrderSchema.index({ soNumber: 'text', poReferenceNumber: 'text' });
salesOrderSchema.index({ 'items.material': 1 });

export const SalesOrder = model<ISalesOrder>('SalesOrder', salesOrderSchema);
export default SalesOrder;

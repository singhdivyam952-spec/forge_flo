import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const DISPATCH_STATUSES = ['Draft', 'Dispatched', 'InTransit', 'Delivered', 'Cancelled'] as const;
export type DispatchStatus = (typeof DISPATCH_STATUSES)[number];

export interface IDispatchItem {
  material: Types.ObjectId;
  qty: number;
  uom: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
}

export interface IDispatch extends Document, IAuditable, ITimestamped {
  dispatchNumber: string;
  salesOrder?: Types.ObjectId;
  packing?: Types.ObjectId;
  customer: Types.ObjectId;
  items: IDispatchItem[];

  vehicleNumber?: string;
  transporter?: string;
  driverName?: string;
  driverContact?: string;
  ewayBillNumber?: string;

  invoiceNumber?: string;
  invoiceDate?: Date;

  dispatchDate: Date;
  deliveryDate?: Date;
  dispatchedBy?: Types.ObjectId;

  status: DispatchStatus;
  documents: Types.ObjectId[];
  remarks?: string;
}

const dispatchItemSchema = new Schema<IDispatchItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
  },
  { _id: true }
);

const dispatchSchema = new Schema<IDispatch>(
  {
    dispatchNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    salesOrder: { type: Schema.Types.ObjectId, ref: 'SalesOrder', index: true },
    packing: { type: Schema.Types.ObjectId, ref: 'Packing' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [dispatchItemSchema], default: [] },

    vehicleNumber: { type: String, trim: true },
    transporter: { type: String, trim: true },
    driverName: { type: String, trim: true },
    driverContact: { type: String, trim: true },
    ewayBillNumber: { type: String, trim: true },

    invoiceNumber: { type: String, trim: true },
    invoiceDate: { type: Date },

    dispatchDate: { type: Date, required: true, default: Date.now },
    deliveryDate: { type: Date },
    dispatchedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: DISPATCH_STATUSES, default: 'Draft', index: true },
    documents: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

dispatchSchema.index({ customer: 1, status: 1 });
dispatchSchema.index({ salesOrder: 1 });
dispatchSchema.index({ dispatchDate: -1 });

export const Dispatch = model<IDispatch>('Dispatch', dispatchSchema);
export default Dispatch;

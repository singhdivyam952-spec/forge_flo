import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const RFQ_STATUSES = ['Draft', 'Sent', 'Received', 'UnderEvaluation', 'Converted', 'Closed'] as const;
export type RfqStatus = (typeof RFQ_STATUSES)[number];

export interface IRfqTimelineEntry {
  status: string;
  changedAt: Date;
  changedBy?: Types.ObjectId;
  remarks?: string;
}

export interface IRfqItem {
  material?: Types.ObjectId;
  partDescription: string;
  drawing?: Types.ObjectId;
  qty: number;
  uom: string;
  targetPrice?: number;
  quotedPrice?: number;
  remarks?: string;
}

export interface IRFQ extends Document, IAuditable, ISoftDeletable, ITimestamped {
  rfqNumber: string;
  enquiry?: Types.ObjectId;
  customer: Types.ObjectId;
  items: IRfqItem[];
  rfqDate: Date;
  dueDate?: Date;
  validityDate?: Date;
  assignedEngineer?: Types.ObjectId;
  currentStatus?: string;
  attachments: Types.ObjectId[];
  approvalTimeline: IRfqTimelineEntry[];
  status: RfqStatus;
  assignedTo?: Types.ObjectId;
  remarks?: string;
}

const rfqTimelineSchema = new Schema<IRfqTimelineEntry>(
  {
    status: { type: String, required: true, trim: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const rfqItemSchema = new Schema<IRfqItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    partDescription: { type: String, required: true, trim: true },
    drawing: { type: Schema.Types.ObjectId, ref: 'Drawing' },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    targetPrice: { type: Number, min: 0 },
    quotedPrice: { type: Number, min: 0 },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const rfqSchema = new Schema<IRFQ>(
  {
    rfqNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    enquiry: { type: Schema.Types.ObjectId, ref: 'CustomerEnquiry' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: { type: [rfqItemSchema], default: [] },
    rfqDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    validityDate: { type: Date },
    assignedEngineer: { type: Schema.Types.ObjectId, ref: 'User' },
    currentStatus: { type: String, trim: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    approvalTimeline: { type: [rfqTimelineSchema], default: [] },
    status: { type: String, enum: RFQ_STATUSES, default: 'Draft', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

rfqSchema.index({ customer: 1, status: 1 });
rfqSchema.index({ enquiry: 1 });

export const RFQ = model<IRFQ>('RFQ', rfqSchema);
export default RFQ;

import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const ENQUIRY_STATUSES = ['Open', 'UnderReview', 'Quoted', 'Converted', 'Lost', 'Closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export interface IStatusTimelineEntry {
  status: string;
  changedAt: Date;
  changedBy?: Types.ObjectId;
  remarks?: string;
}

export interface IEnquiryItem {
  material?: Types.ObjectId;
  partDescription: string;
  drawing?: Types.ObjectId;
  qty: number;
  uom: string;
  targetPrice?: number;
  remarks?: string;
}

export interface ICustomerEnquiry extends Document, IAuditable, ISoftDeletable, ITimestamped {
  enquiryNumber: string;
  customer: Types.ObjectId;
  contactPerson?: string;
  items: IEnquiryItem[];
  enquiryDate: Date;
  dueDate?: Date;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  expectedAnnualVolume?: number;
  customerReferenceNumber?: string;
  salesExecutive?: Types.ObjectId;
  source?: string;
  leadTimeDays?: number;
  deliveryLocation?: string;
  expectedOrderValue?: number;
  selectedProcesses: string[];
  existingPartChecked: boolean;
  existingPartMatched: boolean;
  existingPartReference?: string;
  attachments: Types.ObjectId[];
  statusTimeline: IStatusTimelineEntry[];
  status: EnquiryStatus;
  assignedTo?: Types.ObjectId;
  remarks?: string;
}

const statusTimelineSchema = new Schema<IStatusTimelineEntry>(
  {
    status: { type: String, required: true, trim: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const enquiryItemSchema = new Schema<IEnquiryItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    partDescription: { type: String, required: true, trim: true },
    drawing: { type: Schema.Types.ObjectId, ref: 'Drawing' },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    targetPrice: { type: Number, min: 0 },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const customerEnquirySchema = new Schema<ICustomerEnquiry>(
  {
    enquiryNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    contactPerson: { type: String, trim: true },
    items: { type: [enquiryItemSchema], default: [] },
    enquiryDate: { type: Date, required: true, default: Date.now },
    dueDate: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium', index: true },
    expectedAnnualVolume: { type: Number, min: 0 },
    customerReferenceNumber: { type: String, trim: true },
    salesExecutive: { type: Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, trim: true },
    leadTimeDays: { type: Number, min: 0 },
    deliveryLocation: { type: String, trim: true },
    expectedOrderValue: { type: Number, min: 0 },
    selectedProcesses: { type: [String], default: [] },
    existingPartChecked: { type: Boolean, default: false },
    existingPartMatched: { type: Boolean, default: false },
    existingPartReference: { type: String, trim: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    statusTimeline: { type: [statusTimelineSchema], default: [] },
    status: { type: String, enum: ENQUIRY_STATUSES, default: 'Open', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

customerEnquirySchema.index({ customer: 1, status: 1 });
customerEnquirySchema.index({ enquiryDate: -1 });
customerEnquirySchema.index({ customerReferenceNumber: 1 });

export const CustomerEnquiry = model<ICustomerEnquiry>('CustomerEnquiry', customerEnquirySchema);
export default CustomerEnquiry;

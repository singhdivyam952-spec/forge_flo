import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const QUOTATION_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Revised'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export const QUOTATION_APPROVAL_STATUSES = ['Draft', 'PendingApproval', 'Approved', 'Rejected'] as const;
export type QuotationApprovalStatus = (typeof QUOTATION_APPROVAL_STATUSES)[number];

export interface IQuotationHistoryEntry {
  revisionNumber: number;
  changedAt: Date;
  changedBy?: Types.ObjectId;
  remarks?: string;
}

export interface IQuotationItem {
  material?: Types.ObjectId;
  description: string;
  qty: number;
  uom: string;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  amount: number;
}

export interface IQuotation extends Document, IAuditable, ISoftDeletable, ITimestamped {
  quotationNumber: string;
  rfq?: Types.ObjectId;
  customer: Types.ObjectId;
  costEstimation?: Types.ObjectId;
  items: IQuotationItem[];
  quotationDate: Date;
  validUntil?: Date;
  termsAndConditions?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  status: QuotationStatus;
  revisionNumber: number;
  totalAmount: number;
  currency: string;
  taxes: number;
  discountAmount: number;
  approvalStatus: QuotationApprovalStatus;
  attachments: Types.ObjectId[];
  pdfDocument?: Types.ObjectId;
  emailedAt?: Date;
  emailRecipients: string[];
  history: IQuotationHistoryEntry[];
  preparedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  remarks?: string;
}

const quotationHistorySchema = new Schema<IQuotationHistoryEntry>(
  {
    revisionNumber: { type: Number, required: true, min: 0 },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const quotationItemSchema = new Schema<IQuotationItem>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    taxPercent: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const quotationSchema = new Schema<IQuotation>(
  {
    quotationNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    rfq: { type: Schema.Types.ObjectId, ref: 'RFQ' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    costEstimation: { type: Schema.Types.ObjectId, ref: 'CostEstimation' },
    items: { type: [quotationItemSchema], default: [] },
    quotationDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date },
    termsAndConditions: { type: String, trim: true },
    paymentTerms: { type: String, trim: true },
    deliveryTerms: { type: String, trim: true },
    status: { type: String, enum: QUOTATION_STATUSES, default: 'Draft', index: true },
    revisionNumber: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    taxes: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    approvalStatus: { type: String, enum: QUOTATION_APPROVAL_STATUSES, default: 'Draft', index: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    pdfDocument: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    emailedAt: { type: Date },
    emailRecipients: { type: [String], default: [] },
    history: { type: [quotationHistorySchema], default: [] },
    preparedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

quotationSchema.index({ customer: 1, status: 1 });
quotationSchema.index({ rfq: 1 });
quotationSchema.index({ quotationDate: -1 });

export const Quotation = model<IQuotation>('Quotation', quotationSchema);
export default Quotation;

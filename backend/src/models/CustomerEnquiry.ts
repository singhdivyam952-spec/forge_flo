import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const ENQUIRY_STATUSES = ['Open', 'UnderReview', 'Quoted', 'Converted', 'Lost', 'Closed'] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_PRIORITIES = ['Low', 'Moderate', 'High', 'Urgent'] as const;
export type EnquiryPriority = (typeof ENQUIRY_PRIORITIES)[number];

/** Process types from the marketing flowchart. */
export const ENQUIRY_PROCESSES = ['Machining', 'Forging', 'Fabrication', 'Casting', 'Other'] as const;
export type EnquiryProcess = (typeof ENQUIRY_PROCESSES)[number];

/** High-level stage tracking aligned to the marketing → packing flow. */
export const ENQUIRY_WORKFLOW_STAGES = [
  'EnquiryCreated',
  'DocumentsUploaded',
  'ExistingPartCheck',
  'NPD',
  'Feasibility',
  'CostEstimation',
  'Quotation',
  'PurchaseOrder',
  'PPC',
  'PDI',
  'PackingDispatch',
  'Completed',
  'Rejected',
] as const;
export type EnquiryWorkflowStage = (typeof ENQUIRY_WORKFLOW_STAGES)[number];

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
  /** Business customer ID auto-generated on create (e.g. CUST-2026-0001). */
  customerId: string;
  customerName: string;
  customer?: Types.ObjectId;
  partName?: string;
  partNumber?: string;
  customerDrawingNo?: string;
  contactPerson?: string;
  items: IEnquiryItem[];
  enquiryDate: Date;
  rfqDate?: Date;
  dueDate?: Date;
  priority?: EnquiryPriority;
  expectedAnnualVolume?: number;
  customerReferenceNumber?: string;
  marketingHead?: string;
  /** @deprecated Use marketingHead */
  salesExecutive?: Types.ObjectId;
  source?: string;
  leadTimeDays?: number;
  deliveryLocation?: string;
  expectedOrderValue?: number;
  /** Primary process type (flowchart decision). */
  processType?: EnquiryProcess;
  selectedProcesses: string[];
  /** Requested quantity from customer documents. */
  quantity?: number;
  quantityUom?: string;
  deliverySchedule?: string;
  materialSpecification?: string;
  drawingDocument?: Types.ObjectId;
  cadDocument?: Types.ObjectId;
  materialSpecDocument?: Types.ObjectId;
  existingPartChecked: boolean;
  existingPartMatched: boolean;
  existingPartReference?: string;
  workflowStage: EnquiryWorkflowStage;
  linkedNpd?: Types.ObjectId;
  linkedRfq?: Types.ObjectId;
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
    customerId: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    partName: { type: String, trim: true },
    partNumber: { type: String, trim: true, index: true },
    customerDrawingNo: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    items: { type: [enquiryItemSchema], default: [] },
    enquiryDate: { type: Date, required: true, default: Date.now },
    rfqDate: { type: Date },
    dueDate: { type: Date },
    priority: { type: String, enum: ENQUIRY_PRIORITIES, default: 'Moderate', index: true },
    expectedAnnualVolume: { type: Number, min: 0 },
    customerReferenceNumber: { type: String, trim: true },
    marketingHead: { type: String, trim: true },
    salesExecutive: { type: Schema.Types.ObjectId, ref: 'User' },
    source: { type: String, trim: true },
    leadTimeDays: { type: Number, min: 0 },
    deliveryLocation: { type: String, trim: true },
    expectedOrderValue: { type: Number, min: 0 },
    processType: { type: String, enum: ENQUIRY_PROCESSES, index: true },
    selectedProcesses: { type: [String], default: [] },
    quantity: { type: Number, min: 0 },
    quantityUom: { type: String, trim: true, default: 'Nos' },
    deliverySchedule: { type: String, trim: true },
    materialSpecification: { type: String, trim: true },
    drawingDocument: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    cadDocument: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    materialSpecDocument: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    existingPartChecked: { type: Boolean, default: false },
    existingPartMatched: { type: Boolean, default: false },
    existingPartReference: { type: String, trim: true },
    workflowStage: {
      type: String,
      enum: ENQUIRY_WORKFLOW_STAGES,
      default: 'EnquiryCreated',
      index: true,
    },
    linkedNpd: { type: Schema.Types.ObjectId, ref: 'MarketingNpd' },
    linkedRfq: { type: Schema.Types.ObjectId, ref: 'RFQ' },
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
customerEnquirySchema.index({ customerName: 1 });
customerEnquirySchema.index({ processType: 1, workflowStage: 1 });

export const CustomerEnquiry = model<ICustomerEnquiry>('CustomerEnquiry', customerEnquirySchema);
export default CustomerEnquiry;

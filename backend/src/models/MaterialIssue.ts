import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MATERIAL_ISSUE_STATUSES = ['Draft', 'Issued', 'Cancelled'] as const;
export type MaterialIssueStatus = (typeof MATERIAL_ISSUE_STATUSES)[number];

export interface IMaterialIssueLine {
  material: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  rack?: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalValue: number;
}

export interface IMaterialIssue extends Document, IAuditable, ITimestamped {
  issueNumber: string;
  requisition?: Types.ObjectId;
  productionOrder?: Types.ObjectId;
  warehouse: Types.ObjectId;
  lines: IMaterialIssueLine[];
  issueDate: Date;
  issuedBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId;
  status: MaterialIssueStatus;
  remarks?: string;
}

const materialIssueLineSchema = new Schema<IMaterialIssueLine>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },
    rack: { type: String, trim: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const materialIssueSchema = new Schema<IMaterialIssue>(
  {
    issueNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    requisition: { type: Schema.Types.ObjectId, ref: 'MaterialRequisition' },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lines: { type: [materialIssueLineSchema], default: [] },
    issueDate: { type: Date, required: true, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: MATERIAL_ISSUE_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

materialIssueSchema.index({ productionOrder: 1, issueDate: -1 });
materialIssueSchema.index({ 'lines.material': 1 });
materialIssueSchema.index({ 'lines.batchNumber': 1 });
materialIssueSchema.index({ 'lines.heatNumber': 1 });

export const MaterialIssue = model<IMaterialIssue>('MaterialIssue', materialIssueSchema);
export default MaterialIssue;

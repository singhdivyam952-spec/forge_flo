import { Schema, model, Types, Document } from 'mongoose';
import { IAuditable, ITimestamped } from './common/schema.helpers';

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected', 'Skipped'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/**
 * Generic multi-level approval workflow record. `entityType` + `entityId`
 * point at the document being approved (SalesOrder, PurchaseOrder, BOM, etc.).
 */
export interface IApproval extends Document, IAuditable, ITimestamped {
  entityType: string;
  entityId: Types.ObjectId;
  action: string;
  workflowName?: string;
  level: number;
  sequence: number;
  approver: Types.ObjectId;
  status: ApprovalStatus;
  remarks?: string;
  approvedAt?: Date;
  requestedBy?: Types.ObjectId;
  requestedAt: Date;
}

const approvalSchema = new Schema<IApproval>(
  {
    entityType: { type: String, required: true, trim: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true, trim: true },
    workflowName: { type: String, trim: true },
    level: { type: Number, default: 1, min: 1 },
    sequence: { type: Number, default: 1, min: 1 },
    approver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: APPROVAL_STATUSES, default: 'Pending', index: true },
    remarks: { type: String, trim: true },
    approvedAt: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

approvalSchema.index({ entityType: 1, entityId: 1, sequence: 1 });
approvalSchema.index({ approver: 1, status: 1 });

export const Approval = model<IApproval>('Approval', approvalSchema);
export default Approval;

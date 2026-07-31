import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const ECN_CHANGE_TYPES = ['Design', 'Process', 'Material', 'Drawing', 'BOM', 'Routing'] as const;
export type EcnChangeType = (typeof ECN_CHANGE_TYPES)[number];

export const ECN_STATUSES = ['Requested', 'UnderReview', 'Approved', 'Rejected', 'Implemented'] as const;
export type EcnStatus = (typeof ECN_STATUSES)[number];

export interface IEngineeringChange extends Document, IAuditable, ISoftDeletable, ITimestamped {
  ecnNumber: string;
  changeType: EcnChangeType;
  material?: Types.ObjectId;
  drawing?: Types.ObjectId;
  bom?: Types.ObjectId;
  routing?: Types.ObjectId;
  reason: string;
  description: string;
  impactAnalysis?: string;
  affectedDocuments: string[];
  requestedBy: Types.ObjectId;
  requestedDate: Date;
  status: EcnStatus;
  approvedBy?: Types.ObjectId;
  approvedDate?: Date;
  effectiveDate?: Date;
  rejectionReason?: string;
  remarks?: string;
}

const engineeringChangeSchema = new Schema<IEngineeringChange>(
  {
    ecnNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    changeType: { type: String, enum: ECN_CHANGE_TYPES, required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    drawing: { type: Schema.Types.ObjectId, ref: 'Drawing' },
    bom: { type: Schema.Types.ObjectId, ref: 'BOM' },
    routing: { type: Schema.Types.ObjectId, ref: 'Routing' },
    reason: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    impactAnalysis: { type: String, trim: true },
    affectedDocuments: { type: [String], default: [] },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ECN_STATUSES, default: 'Requested', index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedDate: { type: Date },
    effectiveDate: { type: Date },
    rejectionReason: { type: String, trim: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

engineeringChangeSchema.index({ material: 1, status: 1 });
engineeringChangeSchema.index({ changeType: 1, status: 1 });

export const EngineeringChange = model<IEngineeringChange>('EngineeringChange', engineeringChangeSchema);
export default EngineeringChange;

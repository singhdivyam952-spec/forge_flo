import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const NCR_SOURCES = ['Incoming', 'InProcess', 'Customer', 'Internal', 'Supplier'] as const;
export type NcrSource = (typeof NCR_SOURCES)[number];

export const NCR_SEVERITIES = ['Minor', 'Major', 'Critical'] as const;
export type NcrSeverity = (typeof NCR_SEVERITIES)[number];

export const NCR_STATUSES = ['Open', 'UnderInvestigation', 'ActionTaken', 'Closed', 'Rejected'] as const;
export type NcrStatus = (typeof NCR_STATUSES)[number];

/** Non-Conformance Report — raised against any quality deviation. */
export interface INCR extends Document, IAuditable, ITimestamped {
  ncrNumber: string;
  source: NcrSource;
  qualityInspection?: Types.ObjectId;
  material?: Types.ObjectId;
  productionOrder?: Types.ObjectId;
  supplier?: Types.ObjectId;
  customer?: Types.ObjectId;

  description: string;
  qtyAffected?: number;
  uom?: string;
  severity: NcrSeverity;

  rootCause?: string;
  containmentAction?: string;
  correctiveAction?: string;

  status: NcrStatus;
  raisedBy: Types.ObjectId;
  raisedDate: Date;
  assignedTo?: Types.ObjectId;
  closedBy?: Types.ObjectId;
  closedDate?: Date;

  capa?: Types.ObjectId;
  attachments: Types.ObjectId[];
  remarks?: string;
}

const ncrSchema = new Schema<INCR>(
  {
    ncrNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    source: { type: String, enum: NCR_SOURCES, required: true },
    qualityInspection: { type: Schema.Types.ObjectId, ref: 'QualityInspection' },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder' },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },

    description: { type: String, required: true, trim: true },
    qtyAffected: { type: Number, min: 0 },
    uom: { type: String, trim: true },
    severity: { type: String, enum: NCR_SEVERITIES, default: 'Minor', index: true },

    rootCause: { type: String, trim: true },
    containmentAction: { type: String, trim: true },
    correctiveAction: { type: String, trim: true },

    status: { type: String, enum: NCR_STATUSES, default: 'Open', index: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    raisedDate: { type: Date, required: true, default: Date.now },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedDate: { type: Date },

    capa: { type: Schema.Types.ObjectId, ref: 'CAPA' },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

ncrSchema.index({ status: 1, severity: 1 });
ncrSchema.index({ productionOrder: 1 });
ncrSchema.index({ supplier: 1 });
ncrSchema.index({ customer: 1 });

export const NCR = model<INCR>('NCR', ncrSchema);
export default NCR;

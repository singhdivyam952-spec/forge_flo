import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const CAPA_STATUSES = ['Open', 'InProgress', 'PendingVerification', 'Closed', 'Rejected'] as const;
export type CapaStatus = (typeof CAPA_STATUSES)[number];

/** Corrective And Preventive Action record, typically raised from an NCR. */
export interface ICAPA extends Document, IAuditable, ITimestamped {
  capaNumber: string;
  ncr?: Types.ObjectId;
  source?: string;

  problemDescription: string;
  rootCauseAnalysis?: string;
  correctiveAction?: string;
  preventiveAction?: string;

  responsible: Types.ObjectId;
  targetDate?: Date;
  actualCompletionDate?: Date;

  effectivenessCheck?: string;
  effectivenessCheckDate?: Date;
  verifiedBy?: Types.ObjectId;

  status: CapaStatus;
  attachments: Types.ObjectId[];
  remarks?: string;
}

const capaSchema = new Schema<ICAPA>(
  {
    capaNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    ncr: { type: Schema.Types.ObjectId, ref: 'NCR' },
    source: { type: String, trim: true },

    problemDescription: { type: String, required: true, trim: true },
    rootCauseAnalysis: { type: String, trim: true },
    correctiveAction: { type: String, trim: true },
    preventiveAction: { type: String, trim: true },

    responsible: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetDate: { type: Date },
    actualCompletionDate: { type: Date },

    effectivenessCheck: { type: String, trim: true },
    effectivenessCheckDate: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    status: { type: String, enum: CAPA_STATUSES, default: 'Open', index: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

capaSchema.index({ ncr: 1 });
capaSchema.index({ responsible: 1, status: 1 });

export const CAPA = model<ICAPA>('CAPA', capaSchema);
export default CAPA;

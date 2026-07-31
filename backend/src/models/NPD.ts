import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const NPD_STATUSES = [
  'Initiated',
  'DesignReview',
  'Prototyping',
  'Trial',
  'Approved',
  'Rejected',
  'Completed',
] as const;
export type NpdStatus = (typeof NPD_STATUSES)[number];

export const NPD_STAGE_STATUSES = ['Pending', 'InProgress', 'Completed', 'Skipped'] as const;
export type NpdStageStatus = (typeof NPD_STAGE_STATUSES)[number];

export interface INpdStage {
  stageName: string;
  status: NpdStageStatus;
  startDate?: Date;
  endDate?: Date;
  responsible?: Types.ObjectId;
  remarks?: string;
}

export interface INPD extends Document, IAuditable, ISoftDeletable, ITimestamped {
  npdNumber: string;
  partName: string;
  partNumber: string;
  customer?: Types.ObjectId;
  drawing?: Types.ObjectId;
  material?: Types.ObjectId;
  stages: INpdStage[];
  status: NpdStatus;
  targetLaunchDate?: Date;
  actualLaunchDate?: Date;
  projectOwner?: Types.ObjectId;
  remarks?: string;
}

const npdStageSchema = new Schema<INpdStage>(
  {
    stageName: { type: String, required: true, trim: true },
    status: { type: String, enum: NPD_STAGE_STATUSES, default: 'Pending' },
    startDate: { type: Date },
    endDate: { type: Date },
    responsible: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const npdSchema = new Schema<INPD>(
  {
    npdNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    partName: { type: String, required: true, trim: true },
    partNumber: { type: String, required: true, trim: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    drawing: { type: Schema.Types.ObjectId, ref: 'Drawing' },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    stages: { type: [npdStageSchema], default: [] },
    status: { type: String, enum: NPD_STATUSES, default: 'Initiated', index: true },
    targetLaunchDate: { type: Date },
    actualLaunchDate: { type: Date },
    projectOwner: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

npdSchema.index({ customer: 1, status: 1 });

export const NPD = model<INPD>('NPD', npdSchema);
export default NPD;

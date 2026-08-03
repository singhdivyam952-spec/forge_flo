import { Schema, model, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MARKETING_QA_JOB_TYPES = ['NPD', 'Regular'] as const;
export type MarketingQaJobType = (typeof MARKETING_QA_JOB_TYPES)[number];

export const MARKETING_QA_INSPECTION_STAGES = ['Dispatch', 'PreInspection'] as const;
export type MarketingQaInspectionStage = (typeof MARKETING_QA_INSPECTION_STAGES)[number];

export const MARKETING_QA_STATUSES = ['Draft', 'InProgress', 'Completed', 'Cancelled'] as const;
export type MarketingQaStatus = (typeof MARKETING_QA_STATUSES)[number];

export interface IMarketingQualityAssurance extends Document, IAuditable, ITimestamped {
  qaNumber: string;
  customerName: string;
  customerId?: string;
  partName: string;
  partNumber: string;
  customerDrawingNo?: string;
  jobType: MarketingQaJobType;
  inspectionStage: MarketingQaInspectionStage;
  qtyReceived: number;
  qtyOk: number;
  qtyNotOk: number;
  rejectionQty: number;
  reworkQty: number;
  holdQty: number;
  status: MarketingQaStatus;
  remarks?: string;
}

const marketingQaSchema = new Schema<IMarketingQualityAssurance>(
  {
    qaNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true },
    customerId: { type: String, trim: true, index: true },
    partName: { type: String, trim: true },
    partNumber: { type: String, trim: true, index: true },
    customerDrawingNo: { type: String, trim: true },
    jobType: { type: String, enum: MARKETING_QA_JOB_TYPES, default: 'Regular', index: true },
    inspectionStage: {
      type: String,
      enum: MARKETING_QA_INSPECTION_STAGES,
      default: 'PreInspection',
      index: true,
    },
    qtyReceived: { type: Number, default: 0, min: 0 },
    qtyOk: { type: Number, default: 0, min: 0 },
    qtyNotOk: { type: Number, default: 0, min: 0 },
    rejectionQty: { type: Number, default: 0, min: 0 },
    reworkQty: { type: Number, default: 0, min: 0 },
    holdQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: MARKETING_QA_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },
    ...auditFields,
  },
  { timestamps: true }
);

marketingQaSchema.index({ customerName: 1, partNumber: 1 });

export const MarketingQualityAssurance = model<IMarketingQualityAssurance>(
  'MarketingQualityAssurance',
  marketingQaSchema
);
export default MarketingQualityAssurance;

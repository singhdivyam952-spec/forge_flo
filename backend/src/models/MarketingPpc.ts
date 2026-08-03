import { Schema, model, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MARKETING_PPC_PLANNING_TYPES = ['NPD', 'Regular'] as const;
export type MarketingPpcPlanningType = (typeof MARKETING_PPC_PLANNING_TYPES)[number];

export const MARKETING_PPC_STATUSES = ['Draft', 'Planned', 'InProgress', 'Completed', 'Cancelled'] as const;
export type MarketingPpcStatus = (typeof MARKETING_PPC_STATUSES)[number];

export interface IMarketingPpc extends Document, IAuditable, ITimestamped {
  ppcNumber: string;
  customerName: string;
  customerId?: string;
  partName: string;
  partNumber: string;
  customerDrawingNo?: string;
  planningType: MarketingPpcPlanningType;
  npdStartDate?: Date;
  npdEndDate?: Date;
  plannedQty: number;
  actualQty: number;
  rejectionQty: number;
  reworkQty: number;
  holdQty: number;
  status: MarketingPpcStatus;
  remarks?: string;
}

const marketingPpcSchema = new Schema<IMarketingPpc>(
  {
    ppcNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true },
    customerId: { type: String, trim: true, index: true },
    partName: { type: String, trim: true },
    partNumber: { type: String, trim: true, index: true },
    customerDrawingNo: { type: String, trim: true },
    planningType: { type: String, enum: MARKETING_PPC_PLANNING_TYPES, default: 'Regular', index: true },
    npdStartDate: { type: Date },
    npdEndDate: { type: Date },
    plannedQty: { type: Number, default: 0, min: 0 },
    actualQty: { type: Number, default: 0, min: 0 },
    rejectionQty: { type: Number, default: 0, min: 0 },
    reworkQty: { type: Number, default: 0, min: 0 },
    holdQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: MARKETING_PPC_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },
    ...auditFields,
  },
  { timestamps: true }
);

marketingPpcSchema.index({ customerName: 1, partNumber: 1 });

export const MarketingPpc = model<IMarketingPpc>('MarketingPpc', marketingPpcSchema);
export default MarketingPpc;

import { Schema, model, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MARKETING_PACKING_JOB_TYPES = ['NPD', 'Regular'] as const;
export type MarketingPackingJobType = (typeof MARKETING_PACKING_JOB_TYPES)[number];

export const MARKETING_PACKING_STATUSES = ['Draft', 'Received', 'Packed', 'Dispatched', 'Cancelled'] as const;
export type MarketingPackingStatus = (typeof MARKETING_PACKING_STATUSES)[number];

export interface IMarketingPackingDispatch extends Document, IAuditable, ITimestamped {
  packingNumber: string;
  customerName: string;
  customerId?: string;
  partName: string;
  partNumber: string;
  customerDrawingNo?: string;
  jobType: MarketingPackingJobType;
  qtyReceived: number;
  packedQty: number;
  status: MarketingPackingStatus;
  remarks?: string;
}

const marketingPackingDispatchSchema = new Schema<IMarketingPackingDispatch>(
  {
    packingNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true },
    customerId: { type: String, trim: true, index: true },
    partName: { type: String, trim: true },
    partNumber: { type: String, trim: true, index: true },
    customerDrawingNo: { type: String, trim: true },
    jobType: { type: String, enum: MARKETING_PACKING_JOB_TYPES, default: 'Regular', index: true },
    qtyReceived: { type: Number, default: 0, min: 0 },
    packedQty: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: MARKETING_PACKING_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },
    ...auditFields,
  },
  { timestamps: true }
);

marketingPackingDispatchSchema.index({ customerName: 1, partNumber: 1 });

export const MarketingPackingDispatch = model<IMarketingPackingDispatch>(
  'MarketingPackingDispatch',
  marketingPackingDispatchSchema
);
export default MarketingPackingDispatch;

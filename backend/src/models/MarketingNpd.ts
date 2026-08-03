import { Schema, model, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const MARKETING_NPD_STATUSES = ['Draft', 'InProgress', 'Completed', 'Cancelled'] as const;
export type MarketingNpdStatus = (typeof MARKETING_NPD_STATUSES)[number];

export interface IMarketingNpd extends Document, IAuditable, ITimestamped {
  npdNumber: string;
  customerName: string;
  customerId?: string;
  partName: string;
  partNumber: string;
  customerDrawingNo?: string;
  feasibilityStudy: boolean;
  feasibilityTeamMembers?: string;
  feasibilityPdf?: string;
  reqJigFixtureDesign: boolean;
  reqPfd: boolean;
  reqMaterialConsumables: boolean;
  pfdStartDate?: Date;
  pfdEndDate?: Date;
  pfdPdf?: string;
  jigFixtureStartDate?: Date;
  jigFixtureEndDate?: Date;
  jigFixturePdf?: string;
  materialPurchaseStartDate?: Date;
  materialPurchaseEndDate?: Date;
  materialPurchasePdf?: string;
  materialList?: string;
  status: MarketingNpdStatus;
  remarks?: string;
}

const marketingNpdSchema = new Schema<IMarketingNpd>(
  {
    npdNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    customerName: { type: String, required: true, trim: true },
    customerId: { type: String, trim: true, index: true },
    partName: { type: String, trim: true },
    partNumber: { type: String, trim: true, index: true },
    customerDrawingNo: { type: String, trim: true },
    feasibilityStudy: { type: Boolean, default: false },
    feasibilityTeamMembers: { type: String, trim: true },
    feasibilityPdf: { type: String, trim: true },
    reqJigFixtureDesign: { type: Boolean, default: false },
    reqPfd: { type: Boolean, default: false },
    reqMaterialConsumables: { type: Boolean, default: false },
    pfdStartDate: { type: Date },
    pfdEndDate: { type: Date },
    pfdPdf: { type: String, trim: true },
    jigFixtureStartDate: { type: Date },
    jigFixtureEndDate: { type: Date },
    jigFixturePdf: { type: String, trim: true },
    materialPurchaseStartDate: { type: Date },
    materialPurchaseEndDate: { type: Date },
    materialPurchasePdf: { type: String, trim: true },
    materialList: { type: String, trim: true },
    status: { type: String, enum: MARKETING_NPD_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },
    ...auditFields,
  },
  { timestamps: true }
);

marketingNpdSchema.index({ customerName: 1, partNumber: 1 });

export const MarketingNpd = model<IMarketingNpd>('MarketingNpd', marketingNpdSchema);
export default MarketingNpd;

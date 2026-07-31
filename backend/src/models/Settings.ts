import { Schema, model, Document, Model } from 'mongoose';
import { ValuationMethod } from '../constants';

export interface ICompanySettings extends Document {
  companyName: string;
  companyCode: string;
  logoUrl?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  fiscalYearStartMonth: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  valuationMethod: ValuationMethod;
  lowStockThresholdPercent: number;
  documentPrefixes: Record<string, string>;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const settingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, required: true, default: 'Forge Flo Manufacturing' },
    companyCode: { type: String, required: true, default: 'FFM' },
    logoUrl: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String, default: 'India' },
      pincode: { type: String },
    },
    gstNumber: { type: String },
    panNumber: { type: String },
    cinNumber: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    fiscalYearStartMonth: { type: Number, default: 4, min: 1, max: 12 },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    valuationMethod: { type: String, enum: Object.values(ValuationMethod), default: ValuationMethod.FIFO },
    lowStockThresholdPercent: { type: Number, default: 10 },
    documentPrefixes: {
      type: Schema.Types.Mixed,
      default: {
        PurchaseOrder: 'PO',
        SalesOrder: 'SO',
        GRN: 'GRN',
        Invoice: 'INV',
        DeliveryChallan: 'DC',
        WorkOrder: 'WO',
        JobCard: 'JC',
        MaterialIssue: 'MI',
        MaterialReturn: 'MR',
        QualityInspection: 'QI',
        Quotation: 'QT',
      },
    },
    emailNotificationsEnabled: { type: Boolean, default: true },
    smsNotificationsEnabled: { type: Boolean, default: false },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'settings' }
);

export const Settings: Model<ICompanySettings> = model<ICompanySettings>('Settings', settingsSchema);

export default Settings;

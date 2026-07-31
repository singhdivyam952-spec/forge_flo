import { Schema, model, Types, Document } from 'mongoose';
import {
  auditedSoftDeleteFields,
  addressSchema,
  contactPersonSchema,
  bankDetailsSchema,
  IAddress,
  IContactPerson,
  IBankDetails,
  IAuditable,
  ISoftDeletable,
  ITimestamped,
} from './common/schema.helpers';

export const CUSTOMER_TYPES = ['OEM', 'Trader', 'Individual', 'Exporter', 'Government', 'Other'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export interface ICustomer extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  mobile?: string;
  customerType: CustomerType;
  industry?: string;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;

  addresses: IAddress[];
  contacts: IContactPerson[];
  bankDetails?: IBankDetails;

  creditLimit: number;
  creditDays: number;
  paymentTerms?: string;
  currency: string;

  salesPerson?: Types.ObjectId;
  category?: string;
  rating?: number;

  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;

  website?: string;
  email?: string;
  phone?: string;
  status?: 'Active' | 'Inactive';
  documents: Types.ObjectId[];
  remarks?: string;
}

const customerSchema = new Schema<ICustomer>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    mobile: { type: String, trim: true },
    customerType: { type: String, enum: CUSTOMER_TYPES, default: 'OEM' },
    industry: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },
    cinNumber: { type: String, trim: true, uppercase: true },

    addresses: { type: [addressSchema], default: [] },
    contacts: { type: [contactPersonSchema], default: [] },
    bankDetails: { type: bankDetailsSchema },

    creditLimit: { type: Number, default: 0, min: 0 },
    creditDays: { type: Number, default: 0, min: 0 },
    paymentTerms: { type: String, trim: true },
    currency: { type: String, default: 'INR' },

    salesPerson: { type: Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },

    isActive: { type: Boolean, default: true, index: true },
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, trim: true },

    website: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
    documents: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', code: 'text', gstNumber: 'text' });
customerSchema.index({ customerType: 1, isActive: 1 });
customerSchema.index({ companyName: 'text', email: 'text', phone: 'text' });

export const Customer = model<ICustomer>('Customer', customerSchema);
export default Customer;

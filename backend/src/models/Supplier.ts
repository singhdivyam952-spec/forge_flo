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

export const SUPPLIER_TYPES = ['Manufacturer', 'Trader', 'ServiceProvider', 'Importer', 'Other'] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export interface ISupplier extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  supplierType: SupplierType;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;

  addresses: IAddress[];
  contacts: IContactPerson[];
  bankDetails?: IBankDetails;

  materialsSupplied: Types.ObjectId[];
  leadTimeDays: number;
  paymentTerms?: string;
  creditDays: number;
  currency: string;

  qualityRating?: number;
  deliveryRating?: number;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;

  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;

  website?: string;
  email?: string;
  phone?: string;
  remarks?: string;
}

const supplierSchema = new Schema<ISupplier>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true, index: true },
    supplierType: { type: String, enum: SUPPLIER_TYPES, default: 'Manufacturer' },
    gstNumber: { type: String, trim: true, uppercase: true },
    panNumber: { type: String, trim: true, uppercase: true },
    cinNumber: { type: String, trim: true, uppercase: true },

    addresses: { type: [addressSchema], default: [] },
    contacts: { type: [contactPersonSchema], default: [] },
    bankDetails: { type: bankDetailsSchema },

    materialsSupplied: [{ type: Schema.Types.ObjectId, ref: 'Material' }],
    leadTimeDays: { type: Number, default: 0, min: 0 },
    paymentTerms: { type: String, trim: true },
    creditDays: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },

    qualityRating: { type: Number, min: 0, max: 5 },
    deliveryRating: { type: Number, min: 0, max: 5 },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },

    isActive: { type: Boolean, default: true, index: true },
    isBlacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String, trim: true },

    website: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

supplierSchema.index({ name: 'text', code: 'text', gstNumber: 'text' });
supplierSchema.index({ supplierType: 1, isActive: 1 });
supplierSchema.index({ materialsSupplied: 1 });

export const Supplier = model<ISupplier>('Supplier', supplierSchema);
export default Supplier;

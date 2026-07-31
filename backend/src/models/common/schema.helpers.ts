import { Schema, Types, type SchemaDefinition, type SchemaDefinitionType } from 'mongoose';

/**
 * Shared building blocks reused across the Manufacturing ERP models to keep
 * audit trails, soft deletes and common sub-documents consistent.
 */

/** Fields present on documents that support createdBy / updatedBy auditing. */
export interface IAuditable {
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
}

/** Fields present on documents that support soft delete. */
export interface ISoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId;
}

/** Fields automatically managed by `{ timestamps: true }`. */
export interface ITimestamped {
  createdAt: Date;
  updatedAt: Date;
}

export const auditFields: SchemaDefinition<SchemaDefinitionType<IAuditable>> = {
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
};

export const softDeleteFields: SchemaDefinition<SchemaDefinitionType<ISoftDeletable>> = {
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
};

/** Combined helper for master-data style documents (soft delete + audit). */
export const auditedSoftDeleteFields = {
  ...auditFields,
  ...softDeleteFields,
};

export interface IContactPerson {
  name: string;
  department?: string;
  designation?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export const contactPersonSchema = new Schema<IContactPerson>(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

export interface IAddress {
  label?: string;
  addressType?: 'Billing' | 'Shipping' | 'Registered' | 'Works' | 'Other';
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  isDefault?: boolean;
}

export const ADDRESS_TYPES = ['Billing', 'Shipping', 'Registered', 'Works', 'Other'] as const;

export const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, trim: true },
    addressType: { type: String, enum: ADDRESS_TYPES, default: 'Other' },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' },
    pincode: { type: String, trim: true },
    gstNumber: { type: String, trim: true, uppercase: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

export interface IBankDetails {
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branch?: string;
}

export const bankDetailsSchema = new Schema<IBankDetails>(
  {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    bankName: { type: String, trim: true },
    branch: { type: String, trim: true },
  },
  { _id: false }
);

/** Common lifecycle statuses reused by master/document approval flows. */
export const DOCUMENT_STATUSES = [
  'Draft',
  'UnderReview',
  'Approved',
  'Active',
  'Obsolete',
  'Rejected',
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

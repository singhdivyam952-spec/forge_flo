import { Schema, model, Types, Document } from 'mongoose';
import { IAuditable, ISoftDeletable, ITimestamped, softDeleteFields } from './common/schema.helpers';

export const STORAGE_TYPES = ['local', 's3'] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

/**
 * Generic, polymorphic file attachment used by Drawings, Quality records,
 * Dispatch documents, etc. `entityType` + `entityId` link it back to its owner.
 */
export interface IFileAsset extends Document, IAuditable, ISoftDeletable, ITimestamped {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  key?: string;
  storageType: StorageType;
  entityType?: string;
  entityId?: Types.ObjectId;
  category?: string;
  description?: string;
  version: number;
  previewUrl?: string;
  checksum?: string;
  uploadedBy?: Types.ObjectId;
  isActive: boolean;
}

const fileAssetSchema = new Schema<IFileAsset>(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    path: { type: String, required: true, trim: true },
    key: { type: String, trim: true },
    storageType: { type: String, enum: STORAGE_TYPES, default: 'local' },
    entityType: { type: String, trim: true, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    category: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    version: { type: Number, default: 1, min: 1 },
    previewUrl: { type: String, trim: true },
    checksum: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    ...softDeleteFields,
  },
  { timestamps: true }
);

fileAssetSchema.index({ entityType: 1, entityId: 1 });
fileAssetSchema.index({ uploadedBy: 1 });

export const FileAsset = model<IFileAsset>('FileAsset', fileAssetSchema);
export default FileAsset;

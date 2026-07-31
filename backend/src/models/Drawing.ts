import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const DRAWING_STATUSES = ['Draft', 'UnderReview', 'Released', 'Obsolete'] as const;
export type DrawingStatus = (typeof DRAWING_STATUSES)[number];

export interface IDrawingVersion {
  revision: string;
  file: Types.ObjectId;
  changeDescription?: string;
  releasedBy?: Types.ObjectId;
  releasedDate?: Date;
}

export interface IDrawing extends Document, IAuditable, ISoftDeletable, ITimestamped {
  drawingNumber: string;
  partNumber: string;
  title: string;
  material?: Types.ObjectId;
  customer?: Types.ObjectId;
  currentRevision: string;
  currentFile?: Types.ObjectId;
  versions: IDrawingVersion[];
  status: DrawingStatus;
  remarks?: string;
}

const drawingVersionSchema = new Schema<IDrawingVersion>(
  {
    revision: { type: String, required: true, trim: true },
    file: { type: Schema.Types.ObjectId, ref: 'FileAsset', required: true },
    changeDescription: { type: String, trim: true },
    releasedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    releasedDate: { type: Date },
  },
  { _id: true }
);

const drawingSchema = new Schema<IDrawing>(
  {
    drawingNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    partNumber: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    currentRevision: { type: String, default: 'A', trim: true },
    currentFile: { type: Schema.Types.ObjectId, ref: 'FileAsset' },
    versions: { type: [drawingVersionSchema], default: [] },
    status: { type: String, enum: DRAWING_STATUSES, default: 'Draft', index: true },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

drawingSchema.index({ partNumber: 1, currentRevision: 1 });
drawingSchema.index({ status: 1 });
drawingSchema.index({ drawingNumber: 'text', partNumber: 'text', title: 'text' });

export const Drawing = model<IDrawing>('Drawing', drawingSchema);
export default Drawing;

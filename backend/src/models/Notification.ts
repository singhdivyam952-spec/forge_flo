import { Schema, model, Document, Model, Types } from 'mongoose';
import { NotificationType } from '../constants';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: Object.values(NotificationType), default: NotificationType.Info },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String },
    module: { type: String },
    entityType: { type: String },
    entityId: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> = model<INotification>('Notification', notificationSchema);

export default Notification;

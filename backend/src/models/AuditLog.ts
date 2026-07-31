import { Schema, model, Document, Model, Types } from 'mongoose';
import { AuditAction } from '../constants';

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  userSnapshot?: {
    name: string;
    email: string;
    role: string;
  };
  action: AuditAction;
  module: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userSnapshot: {
      name: { type: String },
      email: { type: String },
      role: { type: String },
    },
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    module: { type: String, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    description: { type: String },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> = model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;

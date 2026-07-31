import { Schema, model, Document, Model, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  jti: string;
  hashedToken: string;
  expiresAt: Date;
  revoked: boolean;
  revokedAt?: Date;
  replacedByJti?: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    hashedToken: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
    replacedByJti: { type: String },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ user: 1, revoked: 1 });

export const RefreshToken: Model<IRefreshToken> = model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;

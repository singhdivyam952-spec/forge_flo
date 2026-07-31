import { Schema, model, Document, Model, Types } from 'mongoose';
import { UserRole } from '../constants';

export interface IUserRefreshToken {
  jti: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  /** Extra permissions granted on top of the role's defaults. */
  additionalPermissions: string[];
  /** Permissions explicitly revoked even if granted by the role. */
  revokedPermissions: string[];
  department?: string;
  designation?: string;
  dateOfJoining?: Date;
  shift?: string;
  reportingManager?: Types.ObjectId;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  passwordChangedAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  refreshTokens: IUserRefreshToken[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;

  comparePassword(candidate: string): Promise<boolean>;
}

const refreshTokenSubSchema = new Schema<IUserRefreshToken>(
  {
    jti: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    userAgent: { type: String },
    ip: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), required: true, default: UserRole.Viewer, index: true },
    additionalPermissions: { type: [String], default: [] },
    revokedPermissions: { type: [String], default: [] },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    dateOfJoining: { type: Date },
    shift: { type: String, trim: true },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User' },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    passwordChangedAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    refreshTokens: { type: [refreshTokenSubSchema], default: [] },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.index({ role: 1, isActive: 1 });

userSchema.methods.comparePassword = async function (this: IUser, candidate: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;

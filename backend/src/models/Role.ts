import { Schema, model, Document, Model } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    description: { type: String, trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Role: Model<IRole> = model<IRole>('Role', roleSchema);

export default Role;

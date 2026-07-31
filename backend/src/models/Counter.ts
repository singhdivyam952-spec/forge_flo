import { Schema, model, Document, Model } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
  updatedAt: Date;
}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, unique: true, index: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Counter: Model<ICounter> = model<ICounter>('Counter', counterSchema);

export default Counter;

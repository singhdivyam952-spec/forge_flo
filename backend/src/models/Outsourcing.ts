import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const OUTSOURCING_STATUSES = ['Sent', 'PartiallyReceived', 'Received', 'Closed', 'Cancelled'] as const;
export type OutsourcingStatus = (typeof OUTSOURCING_STATUSES)[number];

export interface IOutsourcing extends Document, IAuditable, ITimestamped {
  outsourceNumber: string;
  productionOrder?: Types.ObjectId;
  operationSeq?: number;
  vendor: Types.ObjectId;
  material: Types.ObjectId;

  qtySent: number;
  qtyReceived: number;
  qtyRejected: number;
  uom: string;

  sentDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;

  challanNumber?: string;
  cost: number;

  status: OutsourcingStatus;
  remarks?: string;
}

const outsourcingSchema = new Schema<IOutsourcing>(
  {
    outsourceNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    operationSeq: { type: Number },
    vendor: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },

    qtySent: { type: Number, required: true, min: 0 },
    qtyReceived: { type: Number, default: 0, min: 0 },
    qtyRejected: { type: Number, default: 0, min: 0 },
    uom: { type: String, required: true, trim: true },

    sentDate: { type: Date, required: true, default: Date.now },
    expectedReturnDate: { type: Date },
    actualReturnDate: { type: Date },

    challanNumber: { type: String, trim: true },
    cost: { type: Number, default: 0, min: 0 },

    status: { type: String, enum: OUTSOURCING_STATUSES, default: 'Sent', index: true },
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

outsourcingSchema.index({ vendor: 1, status: 1 });
outsourcingSchema.index({ productionOrder: 1 });
outsourcingSchema.index({ material: 1 });

export const Outsourcing = model<IOutsourcing>('Outsourcing', outsourcingSchema);
export default Outsourcing;

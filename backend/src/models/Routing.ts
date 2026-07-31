import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const ROUTING_STATUSES = ['Draft', 'UnderReview', 'Approved', 'Active', 'Obsolete'] as const;
export type RoutingStatus = (typeof ROUTING_STATUSES)[number];

export interface IRoutingOperation {
  seq: number;
  operationName: string;
  processType: string;
  workCenter?: Types.ObjectId;
  machineGroup?: string;
  setupTime: number; // minutes
  runTimePerUnit: number; // minutes per unit
  laborSkill?: string;
  qcRequired?: boolean;
  remarks?: string;
}

export interface IRouting extends Document, IAuditable, ISoftDeletable, ITimestamped {
  finishedMaterial: Types.ObjectId;
  version: string;
  operations: IRoutingOperation[];
  status: RoutingStatus;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  remarks?: string;
}

const routingOperationSchema = new Schema<IRoutingOperation>(
  {
    seq: { type: Number, required: true, min: 1 },
    operationName: { type: String, required: true, trim: true },
    processType: { type: String, required: true, trim: true },
    workCenter: { type: Schema.Types.ObjectId, ref: 'WorkCenter' },
    machineGroup: { type: String, trim: true },
    setupTime: { type: Number, default: 0, min: 0 },
    runTimePerUnit: { type: Number, default: 0, min: 0 },
    laborSkill: { type: String, trim: true },
    qcRequired: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
  },
  { _id: true }
);

const routingSchema = new Schema<IRouting>(
  {
    finishedMaterial: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    version: { type: String, required: true, trim: true },
    operations: { type: [routingOperationSchema], default: [] },
    status: { type: String, enum: ROUTING_STATUSES, default: 'Draft', index: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

routingSchema.index({ finishedMaterial: 1, version: 1 }, { unique: true });
routingSchema.index({ finishedMaterial: 1, status: 1 });
routingSchema.index({ 'operations.workCenter': 1 });

export const Routing = model<IRouting>('Routing', routingSchema);
export default Routing;

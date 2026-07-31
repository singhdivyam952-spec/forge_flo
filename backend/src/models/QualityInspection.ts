import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

export const INSPECTION_TYPES = ['Incoming', 'InProcess', 'PDI', 'Final'] as const;
export type InspectionType = (typeof INSPECTION_TYPES)[number];

export const INSPECTION_REFERENCE_TYPES = ['GoodsReceipt', 'ProductionOrder', 'Dispatch', 'Rework', 'Outsourcing'] as const;
export type InspectionReferenceType = (typeof INSPECTION_REFERENCE_TYPES)[number];

export const INSPECTION_STATUSES = ['Pending', 'InProgress', 'Passed', 'Failed', 'PartiallyPassed'] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_PARAMETER_RESULTS = ['Pass', 'Fail'] as const;
export type InspectionParameterResult = (typeof INSPECTION_PARAMETER_RESULTS)[number];

export interface IInspectionParameter {
  parameter: string;
  specification?: string;
  actualValue?: string;
  unit?: string;
  result: InspectionParameterResult;
}

export interface IQualityInspection extends Document, IAuditable, ITimestamped {
  inspectionNumber: string;
  inspectionType: InspectionType;
  referenceType?: InspectionReferenceType;
  referenceId?: Types.ObjectId;

  material: Types.ObjectId;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;

  qtyInspected: number;
  qtyPassed: number;
  qtyFailed: number;
  qtyRework: number;
  uom?: string;

  inspectionParameters: IInspectionParameter[];
  inspector?: Types.ObjectId;
  inspectionDate: Date;
  status: InspectionStatus;
  attachments: Types.ObjectId[];
  remarks?: string;
}

const inspectionParameterSchema = new Schema<IInspectionParameter>(
  {
    parameter: { type: String, required: true, trim: true },
    specification: { type: String, trim: true },
    actualValue: { type: String, trim: true },
    unit: { type: String, trim: true },
    result: { type: String, enum: INSPECTION_PARAMETER_RESULTS, required: true },
  },
  { _id: true }
);

const qualityInspectionSchema = new Schema<IQualityInspection>(
  {
    inspectionNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    inspectionType: { type: String, enum: INSPECTION_TYPES, required: true, index: true },
    referenceType: { type: String, enum: INSPECTION_REFERENCE_TYPES },
    referenceId: { type: Schema.Types.ObjectId, refPath: 'referenceType' },

    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },

    qtyInspected: { type: Number, default: 0, min: 0 },
    qtyPassed: { type: Number, default: 0, min: 0 },
    qtyFailed: { type: Number, default: 0, min: 0 },
    qtyRework: { type: Number, default: 0, min: 0 },
    uom: { type: String, trim: true },

    inspectionParameters: { type: [inspectionParameterSchema], default: [] },
    inspector: { type: Schema.Types.ObjectId, ref: 'User' },
    inspectionDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: INSPECTION_STATUSES, default: 'Pending', index: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditFields,
  },
  { timestamps: true }
);

qualityInspectionSchema.index({ referenceType: 1, referenceId: 1 });
qualityInspectionSchema.index({ material: 1, inspectionDate: -1 });
qualityInspectionSchema.index({ inspectionType: 1, status: 1 });

export const QualityInspection = model<IQualityInspection>('QualityInspection', qualityInspectionSchema);
export default QualityInspection;

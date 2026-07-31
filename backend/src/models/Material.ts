import { Schema, model, Types, Document } from 'mongoose';
import { auditedSoftDeleteFields, IAuditable, ISoftDeletable, ITimestamped } from './common/schema.helpers';

export const MATERIAL_TYPES = ['raw', 'semi', 'finished', 'consumable', 'scrap', 'tooling'] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const VALUATION_METHODS = ['FIFO', 'Average'] as const;
export type ValuationMethod = (typeof VALUATION_METHODS)[number];

export interface IAlternateUom {
  uom: string;
  conversionFactor: number; // multiply qty in this uom by conversionFactor to get base uom qty
  isPurchaseUom?: boolean;
  isSalesUom?: boolean;
}

export interface IMaterialDimensions {
  length?: number;
  width?: number;
  height?: number;
  uom?: string;
}

export interface IMaterial extends Document, IAuditable, ISoftDeletable, ITimestamped {
  code: string;
  name: string;
  description?: string;
  type: MaterialType;
  category?: string;
  subCategory?: string;
  grade?: string;
  specification?: string;
  drawingNumber?: string;
  barcode?: string;
  hsnCode?: string;
  gstRate?: number;

  uom: string;
  alternateUoms: IAlternateUom[];

  density?: number; // kg/m3
  weight?: number;
  weightUom?: string;
  dimensions?: IMaterialDimensions;

  valuationMethod: ValuationMethod;
  standardCost: number;
  averageCost: number;
  lastPurchasePrice?: number;

  reorderLevel: number;
  reorderQty: number;
  minStockLevel: number;
  maxStockLevel?: number;
  leadTimeDays?: number;
  shelfLifeDays?: number;

  defaultWarehouse?: Types.ObjectId;
  defaultSupplier?: Types.ObjectId;

  isBatchTracked: boolean;
  isHeatNumberTracked: boolean;
  isLotTracked: boolean;
  isSerialTracked: boolean;

  isActive: boolean;
  isCritical: boolean;
  tags: string[];
  attachments: Types.ObjectId[];
  remarks?: string;
}

const alternateUomSchema = new Schema<IAlternateUom>(
  {
    uom: { type: String, required: true, trim: true },
    conversionFactor: { type: Number, required: true, min: 0 },
    isPurchaseUom: { type: Boolean, default: false },
    isSalesUom: { type: Boolean, default: false },
  },
  { _id: false }
);

const materialSchema = new Schema<IMaterial>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: MATERIAL_TYPES, required: true, index: true },
    category: { type: String, trim: true, index: true },
    subCategory: { type: String, trim: true },
    grade: { type: String, trim: true },
    specification: { type: String, trim: true },
    drawingNumber: { type: String, trim: true },
    barcode: { type: String, trim: true, sparse: true, unique: true },
    hsnCode: { type: String, trim: true },
    gstRate: { type: Number, default: 0, min: 0 },

    uom: { type: String, required: true, trim: true },
    alternateUoms: { type: [alternateUomSchema], default: [] },

    density: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    weightUom: { type: String, trim: true },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      uom: { type: String, trim: true },
    },

    valuationMethod: { type: String, enum: VALUATION_METHODS, default: 'Average' },
    standardCost: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0, min: 0 },
    lastPurchasePrice: { type: Number, min: 0 },

    reorderLevel: { type: Number, default: 0, min: 0 },
    reorderQty: { type: Number, default: 0, min: 0 },
    minStockLevel: { type: Number, default: 0, min: 0 },
    maxStockLevel: { type: Number, min: 0 },
    leadTimeDays: { type: Number, min: 0 },
    shelfLifeDays: { type: Number, min: 0 },

    defaultWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    defaultSupplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },

    isBatchTracked: { type: Boolean, default: false },
    isHeatNumberTracked: { type: Boolean, default: false },
    isLotTracked: { type: Boolean, default: false },
    isSerialTracked: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true, index: true },
    isCritical: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'FileAsset' }],
    remarks: { type: String, trim: true },

    ...auditedSoftDeleteFields,
  },
  { timestamps: true }
);

materialSchema.index({ name: 'text', code: 'text', specification: 'text' });
materialSchema.index({ type: 1, isActive: 1 });
materialSchema.index({ category: 1, subCategory: 1 });

export const Material = model<IMaterial>('Material', materialSchema);
export default Material;

import { Schema, model, Types, Document } from 'mongoose';
import { auditFields, IAuditable, ITimestamped } from './common/schema.helpers';

/**
 * Point-in-time on-hand quantity per material/warehouse/rack/batch combination.
 * Kept in sync by StockLedger postings; the ledger remains the source of truth.
 */
export interface IStockBalance extends Document, IAuditable, ITimestamped {
  material: Types.ObjectId;
  warehouse: Types.ObjectId;
  rack?: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;
  qty: number;
  reservedQty: number;
  uom: string;
  unitCost: number;
  totalValue: number;
  lastMovementDate?: Date;
}

const stockBalanceSchema = new Schema<IStockBalance>(
  {
    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    rack: { type: String, trim: true, default: '' },
    batchNumber: { type: String, trim: true, default: '' },
    heatNumber: { type: String, trim: true, default: '' },
    lotNumber: { type: String, trim: true, default: '' },
    qty: { type: Number, required: true, default: 0 },
    reservedQty: { type: Number, required: true, default: 0, min: 0 },
    uom: { type: String, required: true, trim: true },
    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0 },
    lastMovementDate: { type: Date },

    ...auditFields,
  },
  { timestamps: true }
);

// Uniquely identifies one stock "bucket". Empty-string defaults (rather than
// undefined) let the compound unique index behave consistently across drivers.
stockBalanceSchema.index(
  { material: 1, warehouse: 1, rack: 1, batchNumber: 1, heatNumber: 1, lotNumber: 1 },
  { unique: true, name: 'uniq_stock_bucket' }
);
stockBalanceSchema.index({ warehouse: 1, material: 1 });
stockBalanceSchema.index({ batchNumber: 1 });
stockBalanceSchema.index({ heatNumber: 1 });
stockBalanceSchema.index({ lotNumber: 1 });

stockBalanceSchema.virtual('availableQty').get(function (this: IStockBalance) {
  return this.qty - this.reservedQty;
});

export const StockBalance = model<IStockBalance>('StockBalance', stockBalanceSchema);
export default StockBalance;

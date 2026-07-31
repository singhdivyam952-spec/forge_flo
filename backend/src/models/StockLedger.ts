import { Schema, model, Types, Document } from 'mongoose';
import { IAuditable, ITimestamped } from './common/schema.helpers';

export const VOUCHER_TYPES = [
  'Opening',
  'GoodsReceipt',
  'MaterialIssue',
  'MaterialReturn',
  'ProductionReceipt',
  'ProductionConsumption',
  'StockTransfer',
  'StockAdjustment',
  'SalesDispatch',
  'PurchaseReturn',
  'Scrap',
  'HeatTreatment',
  'Outsourcing',
] as const;
export type VoucherType = (typeof VOUCHER_TYPES)[number];

export const LEDGER_TXN_TYPES = ['IN', 'OUT'] as const;
export type LedgerTxnType = (typeof LEDGER_TXN_TYPES)[number];

/**
 * CRITICAL model — immutable, append-only record of every stock movement.
 * StockBalance is a derived/cached projection of this ledger.
 */
export interface IStockLedger extends Document, IAuditable, ITimestamped {
  voucherType: VoucherType;
  voucherNumber: string;
  voucherId: Types.ObjectId;

  material: Types.ObjectId;
  warehouse: Types.ObjectId;
  rack?: string;
  batchNumber?: string;
  heatNumber?: string;
  lotNumber?: string;

  txnType: LedgerTxnType;
  qtyIn: number;
  qtyOut: number;
  balanceQty: number;
  uom: string;

  unitCost: number;
  totalValue: number;

  productionOrder?: Types.ObjectId;
  machine?: Types.ObjectId;
  operator?: Types.ObjectId;
  shift?: Types.ObjectId;

  transactionDate: Date;
  remarks?: string;
}

const stockLedgerSchema = new Schema<IStockLedger>(
  {
    voucherType: { type: String, enum: VOUCHER_TYPES, required: true },
    voucherNumber: { type: String, required: true, trim: true },
    voucherId: { type: Schema.Types.ObjectId, required: true },

    material: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    rack: { type: String, trim: true },
    batchNumber: { type: String, trim: true },
    heatNumber: { type: String, trim: true },
    lotNumber: { type: String, trim: true },

    txnType: { type: String, enum: LEDGER_TXN_TYPES, required: true },
    qtyIn: { type: Number, default: 0, min: 0 },
    qtyOut: { type: Number, default: 0, min: 0 },
    balanceQty: { type: Number, required: true },
    uom: { type: String, required: true, trim: true },

    unitCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0 },

    productionOrder: { type: Schema.Types.ObjectId, ref: 'ProductionOrder', index: true },
    machine: { type: Schema.Types.ObjectId, ref: 'Machine' },
    operator: { type: Schema.Types.ObjectId, ref: 'User' },
    shift: { type: Schema.Types.ObjectId, ref: 'Shift' },

    transactionDate: { type: Date, required: true, default: Date.now },
    remarks: { type: String, trim: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Primary access patterns for the ledger — kept lean since this collection
// grows unbounded and every insert pays the cost of index maintenance.
stockLedgerSchema.index({ material: 1, transactionDate: -1 });
stockLedgerSchema.index({ material: 1, warehouse: 1, transactionDate: -1 });
stockLedgerSchema.index({ voucherType: 1, voucherNumber: 1 });
stockLedgerSchema.index({ voucherId: 1 });
stockLedgerSchema.index({ productionOrder: 1, material: 1 });
stockLedgerSchema.index({ batchNumber: 1 });
stockLedgerSchema.index({ heatNumber: 1 });
stockLedgerSchema.index({ lotNumber: 1 });

export const StockLedger = model<IStockLedger>('StockLedger', stockLedgerSchema);
export default StockLedger;

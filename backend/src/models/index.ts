/**
 * Central re-export point for every Mongoose model in the Manufacturing ERP.
 *
 * Import from here (e.g. `import { Material, ProductionOrder } from '../models'`)
 * rather than reaching into individual files, so call sites stay stable as
 * models are added, split, or reorganised.
 */

// ---- Shared building blocks -------------------------------------------------
export * from './common/schema.helpers';

// ---- Platform / auth (owned elsewhere, re-exported for convenience) --------
export * from './Counter';
export * from './User';
export * from './Role';
export * from './RefreshToken';
export * from './AuditLog';
export * from './Notification';
export * from './Settings';

// ---- Master data -------------------------------------------------------------
export * from './Material';
export * from './Warehouse';
export * from './Customer';
export * from './Supplier';
export * from './Machine';
export * from './WorkCenter';
export * from './Shift';

// ---- Inventory / stock ---------------------------------------------------------
export * from './StockBalance';
export * from './StockLedger';
export * from './StockTransfer';

// ---- Engineering ---------------------------------------------------------------
export * from './BOM';
export * from './Routing';
export * from './Drawing';
export * from './NPD';
export * from './EngineeringChange';

// ---- Sales pipeline --------------------------------------------------------------
export * from './CustomerEnquiry';
export * from './RFQ';
export * from './CostEstimation';
export * from './Quotation';
export * from './SalesOrder';
export * from './MarketingNpd';
export * from './MarketingPpc';
export * from './MarketingQualityAssurance';
export * from './MarketingPackingDispatch';

// ---- Production planning & execution ----------------------------------------------
export * from './ProductionPlan';
export * from './ProductionOrder';

// ---- Materials management --------------------------------------------------------
export * from './MaterialRequisition';
export * from './MaterialIssue';
export * from './MaterialReturn';
export * from './MaterialConsumption';
export * from './Scrap';

// ---- Machines & labor ------------------------------------------------------------
export * from './MachineAllocation';
export * from './MachineDowntime';
export * from './EmployeeAllocation';
export * from './ShopFloorEntry';

// ---- Quality management -----------------------------------------------------------
export * from './Rework';
export * from './QualityInspection';
export * from './NCR';
export * from './CAPA';

// ---- Special processes -------------------------------------------------------------
export * from './HeatTreatment';
export * from './Outsourcing';

// ---- Dispatch ------------------------------------------------------------------------
export * from './Packing';
export * from './Dispatch';

// ---- Procurement ---------------------------------------------------------------------
export * from './PurchaseOrder';
export * from './GoodsReceipt';

// ---- Misc / cross-cutting --------------------------------------------------------------
export * from './FileAsset';
export * from './Approval';

// ---- Convenience map of every model, keyed by its Mongoose model name ------------------
import { Counter } from './Counter';
import { User } from './User';
import { Role } from './Role';
import { RefreshToken } from './RefreshToken';
import { AuditLog } from './AuditLog';
import { Notification } from './Notification';
import { Settings } from './Settings';

import { Material } from './Material';
import { Warehouse } from './Warehouse';
import { Customer } from './Customer';
import { Supplier } from './Supplier';
import { Machine } from './Machine';
import { WorkCenter } from './WorkCenter';
import { Shift } from './Shift';

import { StockBalance } from './StockBalance';
import { StockLedger } from './StockLedger';
import { StockTransfer } from './StockTransfer';

import { BOM } from './BOM';
import { Routing } from './Routing';
import { Drawing } from './Drawing';
import { NPD } from './NPD';
import { EngineeringChange } from './EngineeringChange';

import { CustomerEnquiry } from './CustomerEnquiry';
import { RFQ } from './RFQ';
import { CostEstimation } from './CostEstimation';
import { Quotation } from './Quotation';
import { SalesOrder } from './SalesOrder';

import { ProductionPlan } from './ProductionPlan';
import { ProductionOrder } from './ProductionOrder';

import { MaterialRequisition } from './MaterialRequisition';
import { MaterialIssue } from './MaterialIssue';
import { MaterialReturn } from './MaterialReturn';
import { MaterialConsumption } from './MaterialConsumption';
import { Scrap } from './Scrap';

import { MachineAllocation } from './MachineAllocation';
import { MachineDowntime } from './MachineDowntime';
import { EmployeeAllocation } from './EmployeeAllocation';
import { ShopFloorEntry } from './ShopFloorEntry';

import { Rework } from './Rework';
import { QualityInspection } from './QualityInspection';
import { NCR } from './NCR';
import { CAPA } from './CAPA';

import { HeatTreatment } from './HeatTreatment';
import { Outsourcing } from './Outsourcing';

import { Packing } from './Packing';
import { Dispatch } from './Dispatch';

import { PurchaseOrder } from './PurchaseOrder';
import { GoodsReceipt } from './GoodsReceipt';

import { FileAsset } from './FileAsset';
import { Approval } from './Approval';

export const Models = {
  Counter,
  User,
  Role,
  RefreshToken,
  AuditLog,
  Notification,
  Settings,

  Material,
  Warehouse,
  Customer,
  Supplier,
  Machine,
  WorkCenter,
  Shift,

  StockBalance,
  StockLedger,
  StockTransfer,

  BOM,
  Routing,
  Drawing,
  NPD,
  EngineeringChange,

  CustomerEnquiry,
  RFQ,
  CostEstimation,
  Quotation,
  SalesOrder,

  ProductionPlan,
  ProductionOrder,

  MaterialRequisition,
  MaterialIssue,
  MaterialReturn,
  MaterialConsumption,
  Scrap,

  MachineAllocation,
  MachineDowntime,
  EmployeeAllocation,
  ShopFloorEntry,

  Rework,
  QualityInspection,
  NCR,
  CAPA,

  HeatTreatment,
  Outsourcing,

  Packing,
  Dispatch,

  PurchaseOrder,
  GoodsReceipt,

  FileAsset,
  Approval,
} as const;

export default Models;

/**
 * Central enum/constant definitions for the Manufacturing ERP domain model.
 */

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  PPC = 'PPC',
  Production = 'Production',
  Quality = 'Quality',
  Store = 'Store',
  Purchase = 'Purchase',
  Sales = 'Sales',
  Engineering = 'Engineering',
  Finance = 'Finance',
  Operator = 'Operator',
  Viewer = 'Viewer',
}

export const ALL_USER_ROLES = Object.values(UserRole);

/**
 * Permissions are expressed as `module:action` strings so they can be
 * composed, stored on Roles/Users, and checked cheaply at request time.
 */
export enum PermissionModule {
  Users = 'users',
  Roles = 'roles',
  Customers = 'customers',
  Suppliers = 'suppliers',
  Materials = 'materials',
  Inventory = 'inventory',
  Purchase = 'purchase',
  Sales = 'sales',
  Production = 'production',
  Quality = 'quality',
  Maintenance = 'maintenance',
  Engineering = 'engineering',
  Finance = 'finance',
  Reports = 'reports',
  Settings = 'settings',
  Notifications = 'notifications',
  AuditLogs = 'auditLogs',
}

export enum PermissionAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Approve = 'approve',
  Reject = 'reject',
  Export = 'export',
  Import = 'import',
  Manage = 'manage',
}

function buildPermissions(module: PermissionModule, actions: PermissionAction[]): string[] {
  return actions.map((action) => `${module}:${action}`);
}

const FULL_CRUD: PermissionAction[] = [
  PermissionAction.Create,
  PermissionAction.Read,
  PermissionAction.Update,
  PermissionAction.Delete,
];

const CRUD_APPROVE: PermissionAction[] = [...FULL_CRUD, PermissionAction.Approve, PermissionAction.Reject];

const CRUD_EXPORT_IMPORT: PermissionAction[] = [...FULL_CRUD, PermissionAction.Export, PermissionAction.Import];

/** Flat list of every permission string available in the system. */
export const PERMISSIONS: string[] = [
  ...buildPermissions(PermissionModule.Users, [...FULL_CRUD, PermissionAction.Manage]),
  ...buildPermissions(PermissionModule.Roles, [...FULL_CRUD, PermissionAction.Manage]),
  ...buildPermissions(PermissionModule.Customers, CRUD_EXPORT_IMPORT),
  ...buildPermissions(PermissionModule.Suppliers, CRUD_EXPORT_IMPORT),
  ...buildPermissions(PermissionModule.Materials, CRUD_EXPORT_IMPORT),
  ...buildPermissions(PermissionModule.Inventory, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Purchase, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Sales, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Production, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Quality, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Maintenance, FULL_CRUD),
  ...buildPermissions(PermissionModule.Engineering, CRUD_EXPORT_IMPORT),
  ...buildPermissions(PermissionModule.Finance, CRUD_APPROVE),
  ...buildPermissions(PermissionModule.Reports, [PermissionAction.Read, PermissionAction.Export]),
  ...buildPermissions(PermissionModule.Settings, [PermissionAction.Read, PermissionAction.Update, PermissionAction.Manage]),
  ...buildPermissions(PermissionModule.Notifications, [PermissionAction.Read, PermissionAction.Manage]),
  ...buildPermissions(PermissionModule.AuditLogs, [PermissionAction.Read, PermissionAction.Export]),
];

/** Default permission sets granted per role at seed time. */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.Admin]: PERMISSIONS,
  [UserRole.Manager]: PERMISSIONS.filter((p) => !p.startsWith(PermissionModule.Roles)),
  [UserRole.PPC]: [
    ...buildPermissions(PermissionModule.Production, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Materials, [PermissionAction.Read]),
    ...buildPermissions(PermissionModule.Inventory, [PermissionAction.Read]),
    ...buildPermissions(PermissionModule.Sales, [PermissionAction.Read]),
    ...buildPermissions(PermissionModule.Reports, [PermissionAction.Read, PermissionAction.Export]),
  ],
  [UserRole.Production]: [
    ...buildPermissions(PermissionModule.Production, FULL_CRUD),
    ...buildPermissions(PermissionModule.Materials, [PermissionAction.Read]),
    ...buildPermissions(PermissionModule.Inventory, [PermissionAction.Read]),
  ],
  [UserRole.Quality]: [
    ...buildPermissions(PermissionModule.Quality, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Production, [PermissionAction.Read]),
    ...buildPermissions(PermissionModule.Materials, [PermissionAction.Read]),
  ],
  [UserRole.Store]: [
    ...buildPermissions(PermissionModule.Inventory, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Materials, FULL_CRUD),
    ...buildPermissions(PermissionModule.Purchase, [PermissionAction.Read]),
  ],
  [UserRole.Purchase]: [
    ...buildPermissions(PermissionModule.Purchase, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Suppliers, CRUD_EXPORT_IMPORT),
    ...buildPermissions(PermissionModule.Materials, [PermissionAction.Read]),
  ],
  [UserRole.Sales]: [
    ...buildPermissions(PermissionModule.Sales, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Customers, CRUD_EXPORT_IMPORT),
  ],
  [UserRole.Engineering]: [
    ...buildPermissions(PermissionModule.Engineering, CRUD_EXPORT_IMPORT),
    ...buildPermissions(PermissionModule.Materials, [PermissionAction.Read, PermissionAction.Create, PermissionAction.Update]),
  ],
  [UserRole.Finance]: [
    ...buildPermissions(PermissionModule.Finance, CRUD_APPROVE),
    ...buildPermissions(PermissionModule.Reports, [PermissionAction.Read, PermissionAction.Export]),
  ],
  [UserRole.Operator]: [
    ...buildPermissions(PermissionModule.Production, [PermissionAction.Read, PermissionAction.Update]),
  ],
  [UserRole.Viewer]: PERMISSIONS.filter((p) => p.endsWith(':read')),
};

export enum MaterialType {
  Raw = 'Raw',
  SemiFinished = 'SemiFinished',
  Finished = 'Finished',
  Consumable = 'Consumable',
  Scrap = 'Scrap',
  Tooling = 'Tooling',
}

export enum ProcessType {
  Machining = 'Machining',
  Forging = 'Forging',
  Fabrication = 'Fabrication',
  Casting = 'Casting',
  HeatTreatment = 'HeatTreatment',
  Grinding = 'Grinding',
  Drilling = 'Drilling',
  Welding = 'Welding',
  CNCTurning = 'CNCTurning',
  CNCMilling = 'CNCMilling',
  LaserCutting = 'LaserCutting',
  PressWork = 'PressWork',
  Assembly = 'Assembly',
  Inspection = 'Inspection',
  Packing = 'Packing',
  Dispatch = 'Dispatch',
}

export enum DocumentStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Closed = 'Closed',
}

export enum StockTransactionType {
  Purchase = 'Purchase',
  GRN = 'GRN',
  Issue = 'Issue',
  Return = 'Return',
  Consumption = 'Consumption',
  Scrap = 'Scrap',
  Transfer = 'Transfer',
  Adjustment = 'Adjustment',
  ProductionReceipt = 'ProductionReceipt',
  Dispatch = 'Dispatch',
  SalesReturn = 'SalesReturn',
}

export enum ScrapType {
  RawMaterial = 'RawMaterial',
  ProcessScrap = 'ProcessScrap',
  RejectedFinished = 'RejectedFinished',
  ToolingScrap = 'ToolingScrap',
  PackagingWaste = 'PackagingWaste',
}

export enum InspectionType {
  Incoming = 'Incoming',
  InProcess = 'InProcess',
  Final = 'Final',
  PreDispatch = 'PreDispatch',
  FirstArticle = 'FirstArticle',
}

export enum ValuationMethod {
  FIFO = 'FIFO',
  Average = 'Average',
}

export enum NotificationType {
  Info = 'Info',
  Success = 'Success',
  Warning = 'Warning',
  Error = 'Error',
  ApprovalRequest = 'ApprovalRequest',
  LowStock = 'LowStock',
  OrderUpdate = 'OrderUpdate',
  ProductionAlert = 'ProductionAlert',
  QualityAlert = 'QualityAlert',
  MaintenanceDue = 'MaintenanceDue',
  System = 'System',
}

export enum AuditAction {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  Login = 'Login',
  Logout = 'Logout',
  Approve = 'Approve',
  Reject = 'Reject',
  Export = 'Export',
  Import = 'Import',
  PasswordChange = 'PasswordChange',
  StatusChange = 'StatusChange',
  Other = 'Other',
}

export enum UOM {
  KG = 'KG',
  G = 'G',
  TON = 'TON',
  MM = 'MM',
  CM = 'CM',
  M = 'M',
  INCH = 'INCH',
  FEET = 'FEET',
  PCS = 'PCS',
  SET = 'SET',
  PAIR = 'PAIR',
  LITRE = 'LITRE',
  ML = 'ML',
  SQM = 'SQM',
  SQFT = 'SQFT',
  BOX = 'BOX',
  ROLL = 'ROLL',
  SHEET = 'SHEET',
  BAR = 'BAR',
  COIL = 'COIL',
  DOZEN = 'DOZEN',
  HOUR = 'HOUR',
  KIT = 'KIT',
  NOS = 'NOS',
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 200;

export const COOKIE_NAMES = {
  REFRESH_TOKEN: 'refreshToken',
} as const;

import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import { StatusChip } from '../components/common/StatusChip';
import type { DataTableColumn } from '../components/common/DataTable';
import type { FieldConfig, FieldOption } from '../components/common/ResourceCrudPage';

export interface ModuleConfig {
  key: string;
  title: string;
  endpoint: string;
  idField?: string;
  searchPlaceholder?: string;
  columns: DataTableColumn<Record<string, unknown>>[];
  fields: FieldConfig[];
  disableCreate?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  transformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>;
}

function opts(values: readonly string[]): FieldOption[] {
  return values.map((v) => ({ label: v, value: v }));
}

function dateCell(value: unknown): string {
  if (!value) return '—';
  const d = dayjs(String(value));
  return d.isValid() ? d.format('DD-MMM-YYYY') : '—';
}

function dateTimeCell(value: unknown): string {
  if (!value) return '—';
  const d = dayjs(String(value));
  return d.isValid() ? d.format('DD-MMM-YYYY HH:mm') : '—';
}

function refLabel(value: unknown, primary = 'code', secondary = 'name'): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const obj = value as Record<string, unknown>;
  const p = obj[primary];
  const s = primary === secondary ? undefined : obj[secondary];
  if (p && s) return `${p} — ${s}`;
  if (p) return String(p);
  if (s) return String(s);
  if (obj.soNumber) return String(obj.soNumber);
  if (obj.orderNumber) return String(obj.orderNumber);
  return '—';
}

function refColumn(id: string, label: string, primary = 'code', secondary = 'name'): DataTableColumn<Record<string, unknown>> {
  return {
    id,
    label,
    render: (row) => refLabel(row[id], primary, secondary),
  };
}

function dateColumn(id: string, label: string): DataTableColumn<Record<string, unknown>> {
  return { id, label, render: (row) => dateCell(row[id]) };
}

function statusColumn(id = 'status', label = 'Status'): DataTableColumn<Record<string, unknown>> {
  return { id, label, render: (row) => <StatusChip status={row[id] as string} /> };
}

function boolColumn(id: string, label: string): DataTableColumn<Record<string, unknown>> {
  return {
    id,
    label,
    render: (row) => (
      <Box component="span" sx={{ color: row[id] ? 'success.main' : 'text.disabled', fontWeight: 600 }}>
        {row[id] ? 'Yes' : 'No'}
      </Box>
    ),
  };
}

// ---- Enum option sets (mirrors backend model enums) ----
const CUSTOMER_TYPES = ['OEM', 'Trader', 'Individual', 'Exporter', 'Government', 'Other'] as const;
const SUPPLIER_TYPES = ['Manufacturer', 'Trader', 'ServiceProvider', 'Importer', 'Other'] as const;
const MATERIAL_TYPES = ['raw', 'semi', 'finished', 'consumable', 'scrap', 'tooling'] as const;
const VALUATION_METHODS = ['FIFO', 'Average'] as const;
const WAREHOUSE_TYPES = ['RM', 'FG', 'Scrap', 'WIP', 'Quarantine', 'Consumable', 'Tooling'] as const;
const MACHINE_CATEGORIES = [
  'Lathe', 'CNC', 'VMC', 'Milling', 'Drilling', 'Grinding', 'Furnace', 'Press', 'Welding', 'Inspection', 'Other',
] as const;
const MACHINE_STATUSES = ['Available', 'Running', 'Breakdown', 'Maintenance', 'Idle'] as const;
const USER_ROLES = [
  'Admin', 'Manager', 'PPC', 'Production', 'Quality', 'Store', 'Purchase', 'Sales', 'Engineering', 'Finance', 'Operator', 'Viewer',
] as const;
const BOM_STATUSES = ['Draft', 'UnderReview', 'Approved', 'Active', 'Obsolete'] as const;
const ROUTING_STATUSES = BOM_STATUSES;
const DRAWING_STATUSES = ['Draft', 'UnderReview', 'Released', 'Obsolete'] as const;
const NPD_STATUSES = ['Initiated', 'DesignReview', 'Prototyping', 'Trial', 'Approved', 'Rejected', 'Completed'] as const;
const ECN_CHANGE_TYPES = ['Design', 'Process', 'Material', 'Drawing', 'BOM', 'Routing'] as const;
const ECN_STATUSES = ['Requested', 'UnderReview', 'Approved', 'Rejected', 'Implemented'] as const;
const ENQUIRY_STATUSES = ['Open', 'UnderReview', 'Quoted', 'Converted', 'Lost', 'Closed'] as const;
const RFQ_STATUSES = ['Draft', 'Sent', 'Received', 'UnderEvaluation', 'Converted', 'Closed'] as const;
const COST_ESTIMATION_STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'] as const;
const QUOTATION_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Revised'] as const;
const SALES_ORDER_STATUSES = [
  'Draft', 'Confirmed', 'InProduction', 'PartiallyDelivered', 'Delivered', 'Closed', 'Cancelled',
] as const;
const PURCHASE_ORDER_STATUSES = [
  'Draft', 'Sent', 'Confirmed', 'PartiallyReceived', 'Received', 'Closed', 'Cancelled',
] as const;
const INSPECTION_TYPES = ['Incoming', 'InProcess', 'PDI', 'Final'] as const;
const INSPECTION_STATUSES = ['Pending', 'InProgress', 'Passed', 'Failed', 'PartiallyPassed'] as const;
const NCR_SOURCES = ['Incoming', 'InProcess', 'Customer', 'Internal', 'Supplier'] as const;
const NCR_SEVERITIES = ['Minor', 'Major', 'Critical'] as const;
const NCR_STATUSES = ['Open', 'UnderInvestigation', 'ActionTaken', 'Closed', 'Rejected'] as const;
const CAPA_STATUSES = ['Open', 'InProgress', 'PendingVerification', 'Closed', 'Rejected'] as const;
const REWORK_STATUSES = ['Planned', 'InProgress', 'Completed', 'Scrapped'] as const;
const HEAT_TREATMENT_TYPES = [
  'Annealing', 'Hardening', 'Tempering', 'Normalizing', 'CaseHardening', 'Carburizing', 'Nitriding', 'StressRelieving', 'Other',
] as const;
const HEAT_TREATMENT_STATUSES = ['Planned', 'InProcess', 'Completed', 'Failed'] as const;
const OUTSOURCING_STATUSES = ['Sent', 'PartiallyReceived', 'Received', 'Closed', 'Cancelled'] as const;
const PACKING_STATUSES = ['Draft', 'Packed', 'Dispatched', 'Cancelled'] as const;
const DISPATCH_STATUSES = ['Draft', 'Dispatched', 'InTransit', 'Delivered', 'Cancelled'] as const;
const STOCK_TRANSFER_STATUSES = ['Draft', 'InTransit', 'Received', 'Cancelled'] as const;
const REQUISITION_STATUSES = [
  'Draft', 'Submitted', 'Approved', 'PartiallyIssued', 'Issued', 'Rejected', 'Cancelled',
] as const;
const MATERIAL_RETURN_STATUSES = ['Draft', 'Returned', 'Cancelled'] as const;
const PRODUCTION_PLAN_STATUSES = ['Draft', 'Approved', 'InProgress', 'Completed', 'Cancelled'] as const;
const PLAN_ITEM_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
const MACHINE_ALLOCATION_STATUSES = ['Planned', 'Active', 'Completed', 'Cancelled'] as const;
const EMPLOYEE_ALLOCATION_STATUSES = MACHINE_ALLOCATION_STATUSES;
const NOTIFICATION_TYPES = [
  'Info', 'Success', 'Warning', 'Error', 'ApprovalRequest', 'LowStock', 'OrderUpdate', 'ProductionAlert', 'QualityAlert', 'MaintenanceDue', 'System',
] as const;

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // ---------------- Masters ----------------
  customers: {
    key: 'customers',
    title: 'Customer',
    endpoint: '/customers',
    searchPlaceholder: 'Search by code, name, company, GST, phone, or email…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'companyName', label: 'Company' },
      { id: 'contactPerson', label: 'Contact' },
      { id: 'mobile', label: 'Mobile' },
      { id: 'customerType', label: 'Type' },
      { id: 'gstNumber', label: 'GST No.' },
      { id: 'creditDays', label: 'Credit Days', align: 'right' },
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'companyName', label: 'Company Name' },
      { name: 'contactPerson', label: 'Contact Person' },
      { name: 'mobile', label: 'Mobile' },
      { name: 'customerType', label: 'Type', type: 'select', options: opts(CUSTOMER_TYPES) },
      { name: 'gstNumber', label: 'GST Number' },
      { name: 'panNumber', label: 'PAN Number' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'Phone' },
      { name: 'creditLimit', label: 'Credit Limit', type: 'number' },
      { name: 'creditDays', label: 'Credit Days', type: 'number' },
      { name: 'paymentTerms', label: 'Payment Terms' },
      { name: 'category', label: 'Category' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  suppliers: {
    key: 'suppliers',
    title: 'Supplier',
    endpoint: '/suppliers',
    searchPlaceholder: 'Search by code, name, GST…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'supplierType', label: 'Type' },
      { id: 'gstNumber', label: 'GST No.' },
      { id: 'leadTimeDays', label: 'Lead Days', align: 'right' },
      boolColumn('isApproved', 'Approved'),
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'supplierType', label: 'Type', type: 'select', options: opts(SUPPLIER_TYPES) },
      { name: 'gstNumber', label: 'GST Number' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'Phone' },
      { name: 'leadTimeDays', label: 'Lead Time (days)', type: 'number' },
      { name: 'creditDays', label: 'Credit Days', type: 'number' },
      { name: 'paymentTerms', label: 'Payment Terms' },
      { name: 'isApproved', label: 'Approved', type: 'boolean' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  materials: {
    key: 'materials',
    title: 'Material',
    endpoint: '/materials',
    searchPlaceholder: 'Search by code, name, drawing, barcode…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      { id: 'uom', label: 'UOM' },
      { id: 'standardCost', label: 'Std. Cost', align: 'right' },
      { id: 'reorderLevel', label: 'Reorder Lvl', align: 'right' },
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'type', label: 'Type', type: 'select', options: opts(MATERIAL_TYPES), required: true },
      { name: 'uom', label: 'UOM', required: true },
      { name: 'category', label: 'Category' },
      { name: 'grade', label: 'Grade' },
      { name: 'specification', label: 'Specification' },
      { name: 'drawingNumber', label: 'Drawing Number' },
      { name: 'hsnCode', label: 'HSN Code' },
      { name: 'gstRate', label: 'GST Rate (%)', type: 'number' },
      { name: 'valuationMethod', label: 'Valuation Method', type: 'select', options: opts(VALUATION_METHODS) },
      { name: 'standardCost', label: 'Standard Cost', type: 'number' },
      { name: 'reorderLevel', label: 'Reorder Level', type: 'number' },
      { name: 'reorderQty', label: 'Reorder Qty', type: 'number' },
      { name: 'minStockLevel', label: 'Min Stock Level', type: 'number' },
      { name: 'defaultWarehouse', label: 'Default Warehouse ID' },
      { name: 'defaultSupplier', label: 'Default Supplier ID' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'isCritical', label: 'Critical Item', type: 'boolean' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  warehouses: {
    key: 'warehouses',
    title: 'Warehouse',
    endpoint: '/warehouses',
    searchPlaceholder: 'Search by code or name…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'type', label: 'Type' },
      boolColumn('allowNegativeStock', 'Neg. Stock'),
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'type', label: 'Type', type: 'select', options: opts(WAREHOUSE_TYPES), required: true },
      { name: 'allowNegativeStock', label: 'Allow Negative Stock', type: 'boolean' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  machines: {
    key: 'machines',
    title: 'Machine',
    endpoint: '/machines',
    searchPlaceholder: 'Search by code or name…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'category', label: 'Category' },
      statusColumn(),
      { id: 'hourlyRate', label: 'Hourly Rate', align: 'right' },
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'category', label: 'Category', type: 'select', options: opts(MACHINE_CATEGORIES), required: true },
      { name: 'workCenter', label: 'Work Center ID' },
      { name: 'make', label: 'Make' },
      { name: 'model', label: 'Model' },
      { name: 'serialNumber', label: 'Serial Number' },
      { name: 'capacity', label: 'Capacity', type: 'number' },
      { name: 'hourlyRate', label: 'Hourly Rate', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: opts(MACHINE_STATUSES) },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'work-centers': {
    key: 'work-centers',
    title: 'Work Center',
    endpoint: '/work-centers',
    searchPlaceholder: 'Search by code or name…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'department', label: 'Department' },
      { id: 'capacityPerShift', label: 'Capacity/Shift', align: 'right' },
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'department', label: 'Department' },
      { name: 'costCenter', label: 'Cost Center' },
      { name: 'capacityPerShift', label: 'Capacity / Shift', type: 'number' },
      { name: 'hourlyOverheadRate', label: 'Hourly Overhead Rate', type: 'number' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  shifts: {
    key: 'shifts',
    title: 'Shift',
    endpoint: '/shifts',
    searchPlaceholder: 'Search by code or name…',
    columns: [
      { id: 'code', label: 'Code' },
      { id: 'name', label: 'Name' },
      { id: 'startTime', label: 'Start' },
      { id: 'endTime', label: 'End' },
      boolColumn('isNightShift', 'Night'),
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'startTime', label: 'Start Time (HH:mm)', required: true },
      { name: 'endTime', label: 'End Time (HH:mm)', required: true },
      { name: 'breakMinutes', label: 'Break (minutes)', type: 'number' },
      { name: 'isNightShift', label: 'Night Shift', type: 'boolean' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
    ],
  },
  users: {
    key: 'users',
    title: 'User',
    endpoint: '/users',
    idField: '_id',
    searchPlaceholder: 'Search by name, email, employee code…',
    columns: [
      { id: 'employeeCode', label: 'Emp Code' },
      { id: 'fullName', label: 'Name', render: (row) => `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || '—' },
      { id: 'email', label: 'Email' },
      { id: 'role', label: 'Role' },
      { id: 'department', label: 'Department' },
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'employeeCode', label: 'Employee Code', required: true },
      { name: 'firstName', label: 'First Name', required: true },
      { name: 'lastName', label: 'Last Name' },
      { name: 'email', label: 'Email', required: true },
      { name: 'password', label: 'Password', helperText: 'Required when creating a new user' },
      { name: 'phone', label: 'Phone' },
      { name: 'role', label: 'Role', type: 'select', options: opts(USER_ROLES), required: true },
      { name: 'department', label: 'Department' },
      { name: 'designation', label: 'Designation' },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
    ],
  },
  roles: {
    key: 'roles',
    title: 'Role',
    endpoint: '/roles',
    searchPlaceholder: 'Search by name…',
    columns: [
      { id: 'name', label: 'Name' },
      { id: 'description', label: 'Description' },
      { id: 'permissions', label: 'Permissions', render: (row) => `${(row.permissions as unknown[] | undefined)?.length ?? 0} granted` },
      boolColumn('isSystem', 'System'),
      boolColumn('isActive', 'Active'),
    ],
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'Description', gridSize: 12 },
      { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
    ],
  },

  // ---------------- Engineering ----------------
  boms: {
    key: 'boms',
    title: 'BOM',
    endpoint: '/boms',
    searchPlaceholder: 'Search by version…',
    columns: [
      refColumn('finishedMaterial', 'Finished Material'),
      { id: 'version', label: 'Version' },
      { id: 'baseQty', label: 'Base Qty', align: 'right' },
      { id: 'baseUom', label: 'UOM' },
      statusColumn(),
    ],
    fields: [
      { name: 'finishedMaterial', label: 'Finished Material ID', required: true },
      { name: 'version', label: 'Version', required: true },
      { name: 'baseQty', label: 'Base Qty', type: 'number', defaultValue: 1 },
      { name: 'baseUom', label: 'Base UOM' },
      { name: 'status', label: 'Status', type: 'select', options: opts(BOM_STATUSES) },
      { name: 'effectiveFrom', label: 'Effective From', type: 'date' },
      { name: 'effectiveTo', label: 'Effective To', type: 'date' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  routings: {
    key: 'routings',
    title: 'Routing',
    endpoint: '/routings',
    searchPlaceholder: 'Search by version…',
    columns: [
      refColumn('finishedMaterial', 'Finished Material'),
      { id: 'version', label: 'Version' },
      { id: 'operations', label: 'Operations', render: (row) => `${(row.operations as unknown[] | undefined)?.length ?? 0}` },
      statusColumn(),
    ],
    fields: [
      { name: 'finishedMaterial', label: 'Finished Material ID', required: true },
      { name: 'version', label: 'Version', required: true },
      { name: 'status', label: 'Status', type: 'select', options: opts(ROUTING_STATUSES) },
      { name: 'effectiveFrom', label: 'Effective From', type: 'date' },
      { name: 'effectiveTo', label: 'Effective To', type: 'date' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  drawings: {
    key: 'drawings',
    title: 'Drawing',
    endpoint: '/drawings',
    searchPlaceholder: 'Search by drawing/part number, title…',
    columns: [
      { id: 'drawingNumber', label: 'Drawing No.' },
      { id: 'partNumber', label: 'Part No.' },
      { id: 'title', label: 'Title' },
      { id: 'currentRevision', label: 'Rev.' },
      statusColumn(),
    ],
    fields: [
      { name: 'partNumber', label: 'Part Number', required: true },
      { name: 'title', label: 'Title', required: true },
      { name: 'material', label: 'Material ID' },
      { name: 'customer', label: 'Customer ID' },
      { name: 'currentRevision', label: 'Current Revision', defaultValue: 'A' },
      { name: 'status', label: 'Status', type: 'select', options: opts(DRAWING_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  npd: {
    key: 'npd',
    title: 'NPD Project',
    endpoint: '/npd',
    idField: '_id',
    searchPlaceholder: 'Search by NPD number…',
    columns: [
      { id: 'npdNumber', label: 'NPD No.' },
      { id: 'partName', label: 'Part Name' },
      { id: 'partNumber', label: 'Part No.' },
      refColumn('customer', 'Customer'),
      statusColumn(),
    ],
    fields: [
      { name: 'partName', label: 'Part Name', required: true },
      { name: 'partNumber', label: 'Part Number', required: true },
      { name: 'customer', label: 'Customer ID' },
      { name: 'drawing', label: 'Drawing ID' },
      { name: 'material', label: 'Material ID' },
      { name: 'status', label: 'Status', type: 'select', options: opts(NPD_STATUSES) },
      { name: 'targetLaunchDate', label: 'Target Launch Date', type: 'date' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'engineering-changes': {
    key: 'engineering-changes',
    title: 'Engineering Change',
    endpoint: '/engineering-changes',
    searchPlaceholder: 'Search by ECN number, reason…',
    columns: [
      { id: 'ecnNumber', label: 'ECN No.' },
      { id: 'changeType', label: 'Type' },
      { id: 'reason', label: 'Reason' },
      statusColumn(),
    ],
    fields: [
      { name: 'changeType', label: 'Change Type', type: 'select', options: opts(ECN_CHANGE_TYPES), required: true },
      { name: 'material', label: 'Material ID' },
      { name: 'drawing', label: 'Drawing ID' },
      { name: 'bom', label: 'BOM ID' },
      { name: 'routing', label: 'Routing ID' },
      { name: 'reason', label: 'Reason', required: true, gridSize: 12 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, gridSize: 12 },
      { name: 'impactAnalysis', label: 'Impact Analysis', type: 'textarea', gridSize: 12 },
      { name: 'status', label: 'Status', type: 'select', options: opts(ECN_STATUSES) },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
    ],
  },

  // ---------------- Sales ----------------
  enquiries: {
    key: 'enquiries',
    title: 'Customer Enquiry',
    endpoint: '/enquiries',
    searchPlaceholder: 'Search by enquiry number…',
    columns: [
      { id: 'enquiryNumber', label: 'Enquiry No.' },
      refColumn('customer', 'Customer'),
      { id: 'customerReferenceNumber', label: 'Customer Ref.' },
      { id: 'priority', label: 'Priority' },
      dateColumn('enquiryDate', 'Date'),
      statusColumn(),
    ],
    fields: [
      { name: 'customer', label: 'Customer ID', required: true },
      { name: 'contactPerson', label: 'Contact Person' },
      { name: 'source', label: 'Source' },
      { name: 'customerReferenceNumber', label: 'Customer Reference Number' },
      { name: 'priority', label: 'Priority', type: 'select', options: opts(['Low', 'Medium', 'High', 'Urgent'] as const) },
      { name: 'expectedAnnualVolume', label: 'Expected Annual Volume', type: 'number' },
      { name: 'salesExecutive', label: 'Sales Executive (User ID)' },
      { name: 'enquiryDate', label: 'Enquiry Date', type: 'date' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'leadTimeDays', label: 'Lead Time (days)', type: 'number' },
      { name: 'deliveryLocation', label: 'Delivery Location' },
      { name: 'expectedOrderValue', label: 'Expected Order Value', type: 'number' },
      { name: 'selectedProcesses', label: 'Selected Processes (comma separated)' },
      { name: 'status', label: 'Status', type: 'select', options: opts(ENQUIRY_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
    transformSubmit: (values) => ({
      ...values,
      selectedProcesses:
        typeof values.selectedProcesses === 'string'
          ? String(values.selectedProcesses)
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : values.selectedProcesses,
    }),
  },
  rfqs: {
    key: 'rfqs',
    title: 'RFQ',
    endpoint: '/rfqs',
    searchPlaceholder: 'Search by RFQ number…',
    columns: [
      { id: 'rfqNumber', label: 'RFQ No.' },
      refColumn('customer', 'Customer'),
      { id: 'currentStatus', label: 'Current Status' },
      dateColumn('rfqDate', 'Date'),
      statusColumn(),
    ],
    fields: [
      { name: 'customer', label: 'Customer ID', required: true },
      { name: 'enquiry', label: 'Enquiry ID' },
      { name: 'rfqDate', label: 'RFQ Date', type: 'date' },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'validityDate', label: 'Validity Date', type: 'date' },
      { name: 'assignedEngineer', label: 'Assigned Engineer (User ID)' },
      { name: 'currentStatus', label: 'Current Status' },
      { name: 'status', label: 'Status', type: 'select', options: opts(RFQ_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'cost-estimations': {
    key: 'cost-estimations',
    title: 'Cost Estimation',
    endpoint: '/cost-estimations',
    searchPlaceholder: 'Search by estimation number…',
    columns: [
      { id: 'estimationNumber', label: 'Estimation No.' },
      { id: 'partDescription', label: 'Part' },
      { id: 'totalCost', label: 'Total Cost', align: 'right' },
      { id: 'unitCost', label: 'Unit Cost', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'rfq', label: 'RFQ ID' },
      { name: 'material', label: 'Material ID' },
      { name: 'partDescription', label: 'Part Description' },
      { name: 'qty', label: 'Qty', type: 'number', defaultValue: 1 },
      { name: 'uom', label: 'UOM' },
      { name: 'materialCost', label: 'Material Cost', type: 'number' },
      { name: 'laborCost', label: 'Labor Cost', type: 'number' },
      { name: 'machineCost', label: 'Machine Cost', type: 'number' },
      { name: 'overheadCost', label: 'Overhead Cost', type: 'number' },
      { name: 'marginPercent', label: 'Margin %', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: opts(COST_ESTIMATION_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  quotations: {
    key: 'quotations',
    title: 'Quotation',
    endpoint: '/quotations',
    searchPlaceholder: 'Search by quotation number…',
    columns: [
      { id: 'quotationNumber', label: 'Quotation No.' },
      refColumn('customer', 'Customer'),
      dateColumn('quotationDate', 'Date'),
      { id: 'approvalStatus', label: 'Approval' },
      { id: 'totalAmount', label: 'Amount', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'customer', label: 'Customer ID', required: true },
      { name: 'rfq', label: 'RFQ ID' },
      { name: 'quotationDate', label: 'Quotation Date', type: 'date' },
      { name: 'validUntil', label: 'Valid Until', type: 'date' },
      { name: 'paymentTerms', label: 'Payment Terms' },
      { name: 'deliveryTerms', label: 'Delivery Terms' },
      { name: 'taxes', label: 'Taxes', type: 'number' },
      { name: 'discountAmount', label: 'Discount Amount', type: 'number' },
      { name: 'approvalStatus', label: 'Approval Status', type: 'select', options: opts(['Draft', 'PendingApproval', 'Approved', 'Rejected'] as const) },
      { name: 'status', label: 'Status', type: 'select', options: opts(QUOTATION_STATUSES) },
      { name: 'totalAmount', label: 'Total Amount', type: 'number' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'sales-orders': {
    key: 'sales-orders',
    title: 'Sales Order',
    endpoint: '/sales-orders',
    searchPlaceholder: 'Search by sales order number or customer PO…',
    columns: [
      { id: 'soNumber', label: 'SO No.' },
      refColumn('customer', 'Customer'),
      dateColumn('orderDate', 'Order Date'),
      { id: 'poReferenceNumber', label: 'Customer PO No.' },
      { id: 'totalAmount', label: 'Amount', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'customer', label: 'Customer ID', required: true },
      { name: 'quotation', label: 'Quotation ID' },
      { name: 'orderDate', label: 'Order Date', type: 'date' },
      { name: 'requiredDate', label: 'Required Date', type: 'date' },
      { name: 'poReferenceNumber', label: 'Customer PO Ref.' },
      { name: 'paymentTerms', label: 'Payment Terms' },
      { name: 'productionStatus', label: 'Production Status' },
      { name: 'dispatchStatus', label: 'Dispatch Status' },
      { name: 'status', label: 'Status', type: 'select', options: opts(SALES_ORDER_STATUSES) },
      { name: 'totalAmount', label: 'Total Amount', type: 'number' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  packing: {
    key: 'packing',
    title: 'Packing',
    endpoint: '/packing',
    searchPlaceholder: 'Search by packing number…',
    columns: [
      { id: 'packingNumber', label: 'Packing No.' },
      refColumn('salesOrder', 'Sales Order', 'soNumber', 'soNumber'),
      dateColumn('packingDate', 'Date'),
      { id: 'totalPackages', label: 'Packages', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'salesOrder', label: 'Sales Order ID' },
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'packingDate', label: 'Packing Date', type: 'date' },
      { name: 'totalPackages', label: 'Total Packages', type: 'number' },
      { name: 'totalWeight', label: 'Total Weight', type: 'number' },
      { name: 'weightUom', label: 'Weight UOM', defaultValue: 'kg' },
      { name: 'status', label: 'Status', type: 'select', options: opts(PACKING_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  dispatches: {
    key: 'dispatches',
    title: 'Dispatch',
    endpoint: '/dispatches',
    searchPlaceholder: 'Search by dispatch number…',
    columns: [
      { id: 'dispatchNumber', label: 'Dispatch No.' },
      refColumn('customer', 'Customer'),
      dateColumn('dispatchDate', 'Date'),
      { id: 'vehicleNumber', label: 'Vehicle' },
      statusColumn(),
    ],
    fields: [
      { name: 'customer', label: 'Customer ID', required: true },
      { name: 'salesOrder', label: 'Sales Order ID' },
      { name: 'packing', label: 'Packing ID' },
      { name: 'vehicleNumber', label: 'Vehicle Number' },
      { name: 'transporter', label: 'Transporter' },
      { name: 'ewayBillNumber', label: 'E-Way Bill Number' },
      { name: 'invoiceNumber', label: 'Invoice Number' },
      { name: 'dispatchDate', label: 'Dispatch Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: opts(DISPATCH_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },

  // ---------------- Production ----------------
  'production-plans': {
    key: 'production-plans',
    title: 'Production Plan',
    endpoint: '/production-plans',
    searchPlaceholder: 'Search by plan number…',
    columns: [
      { id: 'planNumber', label: 'Plan No.' },
      dateColumn('planningPeriodFrom', 'From'),
      dateColumn('planningPeriodTo', 'To'),
      { id: 'items', label: 'Items', render: (row) => `${(row.items as unknown[] | undefined)?.length ?? 0}` },
      statusColumn(),
    ],
    fields: [
      { name: 'planningPeriodFrom', label: 'Period From', type: 'date', required: true },
      { name: 'planningPeriodTo', label: 'Period To', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: opts(PRODUCTION_PLAN_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'machine-allocations': {
    key: 'machine-allocations',
    title: 'Machine Allocation',
    endpoint: '/machine-allocations',
    searchPlaceholder: 'Search…',
    columns: [
      refColumn('machine', 'Machine'),
      refColumn('productionOrder', 'Production Order', 'orderNumber', 'orderNumber'),
      dateTimeColumnDef('plannedStart', 'Planned Start'),
      dateTimeColumnDef('plannedEnd', 'Planned End'),
      statusColumn(),
    ],
    fields: [
      { name: 'machine', label: 'Machine ID', required: true },
      { name: 'productionOrder', label: 'Production Order ID', required: true },
      { name: 'operationSeq', label: 'Operation Seq.', type: 'number' },
      { name: 'shift', label: 'Shift ID' },
      { name: 'plannedStart', label: 'Planned Start', type: 'date', required: true },
      { name: 'plannedEnd', label: 'Planned End', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: opts(MACHINE_ALLOCATION_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'employee-allocations': {
    key: 'employee-allocations',
    title: 'Employee Allocation',
    endpoint: '/employee-allocations',
    searchPlaceholder: 'Search…',
    columns: [
      refColumn('employee', 'Employee', 'employeeCode', 'firstName'),
      refColumn('shift', 'Shift'),
      dateColumn('date', 'Date'),
      { id: 'skillLevel', label: 'Skill' },
      statusColumn(),
    ],
    fields: [
      { name: 'employee', label: 'Employee ID', required: true },
      { name: 'machine', label: 'Machine ID' },
      { name: 'workCenter', label: 'Work Center ID' },
      { name: 'shift', label: 'Shift ID', required: true },
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'skillLevel', label: 'Skill Level' },
      { name: 'status', label: 'Status', type: 'select', options: opts(EMPLOYEE_ALLOCATION_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },

  // ---------------- Inventory ----------------
  'material-requisitions': {
    key: 'material-requisitions',
    title: 'Material Requisition',
    endpoint: '/material-requisitions',
    searchPlaceholder: 'Search by requisition number…',
    columns: [
      { id: 'requisitionNumber', label: 'Requisition No.' },
      refColumn('productionOrder', 'Production Order', 'orderNumber', 'orderNumber'),
      dateColumn('requisitionDate', 'Date'),
      { id: 'department', label: 'Department' },
      statusColumn(),
    ],
    fields: [
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'requestedBy', label: 'Requested By (User ID)', required: true },
      { name: 'department', label: 'Department' },
      { name: 'requiredDate', label: 'Required Date', type: 'date' },
      { name: 'requisitionDate', label: 'Requisition Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: opts(REQUISITION_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'material-returns': {
    key: 'material-returns',
    title: 'Material Return',
    endpoint: '/material-returns',
    searchPlaceholder: 'Search by return number…',
    columns: [
      { id: 'returnNumber', label: 'Return No.' },
      refColumn('productionOrder', 'Production Order', 'orderNumber', 'orderNumber'),
      refColumn('warehouse', 'Warehouse'),
      dateColumn('returnDate', 'Date'),
      statusColumn(),
    ],
    disableDelete: true,
    fields: [
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'materialIssue', label: 'Material Issue ID' },
      { name: 'warehouse', label: 'Warehouse ID', required: true },
      { name: 'returnDate', label: 'Return Date', type: 'date' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'material-consumptions': {
    key: 'material-consumptions',
    title: 'Material Consumption',
    endpoint: '/material-consumptions',
    searchPlaceholder: 'Search…',
    columns: [
      refColumn('productionOrder', 'Production Order', 'orderNumber', 'orderNumber'),
      refColumn('material', 'Material'),
      { id: 'qtyConsumed', label: 'Consumed', align: 'right' },
      { id: 'qtyScrap', label: 'Scrap', align: 'right' },
      { id: 'qtyBalance', label: 'Balance', align: 'right' },
      dateColumn('consumptionDate', 'Date'),
    ],
    disableDelete: true,
    fields: [
      { name: 'productionOrder', label: 'Production Order ID', required: true },
      { name: 'material', label: 'Material ID', required: true },
      { name: 'qtyConsumed', label: 'Qty Consumed', type: 'number', required: true },
      { name: 'qtyScrap', label: 'Qty Scrap', type: 'number' },
      { name: 'uom', label: 'UOM', required: true },
      { name: 'machine', label: 'Machine ID' },
      { name: 'operator', label: 'Operator ID' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  'stock-transfers': {
    key: 'stock-transfers',
    title: 'Stock Transfer',
    endpoint: '/stock-transfers',
    searchPlaceholder: 'Search by transfer number…',
    columns: [
      { id: 'transferNumber', label: 'Transfer No.' },
      refColumn('fromWarehouse', 'From'),
      refColumn('toWarehouse', 'To'),
      dateColumn('transferDate', 'Date'),
      statusColumn(),
    ],
    fields: [
      { name: 'fromWarehouse', label: 'From Warehouse ID', required: true },
      { name: 'toWarehouse', label: 'To Warehouse ID', required: true },
      { name: 'transferDate', label: 'Transfer Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: opts(STOCK_TRANSFER_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },

  // ---------------- Quality ----------------
  inspections: {
    key: 'inspections',
    title: 'Quality Inspection',
    endpoint: '/inspections',
    searchPlaceholder: 'Search by inspection number…',
    columns: [
      { id: 'inspectionNumber', label: 'Inspection No.' },
      { id: 'inspectionType', label: 'Type' },
      refColumn('material', 'Material'),
      { id: 'qtyPassed', label: 'Passed', align: 'right' },
      { id: 'qtyFailed', label: 'Failed', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'inspectionType', label: 'Type', type: 'select', options: opts(INSPECTION_TYPES), required: true },
      { name: 'material', label: 'Material ID', required: true },
      { name: 'batchNumber', label: 'Batch Number' },
      { name: 'heatNumber', label: 'Heat Number' },
      { name: 'qtyInspected', label: 'Qty Inspected', type: 'number' },
      { name: 'qtyPassed', label: 'Qty Passed', type: 'number' },
      { name: 'qtyFailed', label: 'Qty Failed', type: 'number' },
      { name: 'inspectionDate', label: 'Inspection Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: opts(INSPECTION_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  ncrs: {
    key: 'ncrs',
    title: 'NCR',
    endpoint: '/ncrs',
    searchPlaceholder: 'Search by NCR number…',
    columns: [
      { id: 'ncrNumber', label: 'NCR No.' },
      { id: 'source', label: 'Source' },
      { id: 'severity', label: 'Severity' },
      { id: 'description', label: 'Description' },
      statusColumn(),
    ],
    fields: [
      { name: 'source', label: 'Source', type: 'select', options: opts(NCR_SOURCES), required: true },
      { name: 'material', label: 'Material ID' },
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'supplier', label: 'Supplier ID' },
      { name: 'customer', label: 'Customer ID' },
      { name: 'description', label: 'Description', required: true, gridSize: 12 },
      { name: 'qtyAffected', label: 'Qty Affected', type: 'number' },
      { name: 'severity', label: 'Severity', type: 'select', options: opts(NCR_SEVERITIES) },
      { name: 'rootCause', label: 'Root Cause', type: 'textarea', gridSize: 12 },
      { name: 'correctiveAction', label: 'Corrective Action', type: 'textarea', gridSize: 12 },
      { name: 'raisedBy', label: 'Raised By (User ID)', required: true },
      { name: 'status', label: 'Status', type: 'select', options: opts(NCR_STATUSES) },
    ],
  },
  capas: {
    key: 'capas',
    title: 'CAPA',
    endpoint: '/capas',
    searchPlaceholder: 'Search by CAPA number…',
    columns: [
      { id: 'capaNumber', label: 'CAPA No.' },
      { id: 'problemDescription', label: 'Problem' },
      refColumn('responsible', 'Responsible', 'firstName', 'lastName'),
      dateColumn('targetDate', 'Target Date'),
      statusColumn(),
    ],
    fields: [
      { name: 'ncr', label: 'NCR ID' },
      { name: 'problemDescription', label: 'Problem Description', required: true, gridSize: 12 },
      { name: 'rootCauseAnalysis', label: 'Root Cause Analysis', type: 'textarea', gridSize: 12 },
      { name: 'correctiveAction', label: 'Corrective Action', type: 'textarea', gridSize: 12 },
      { name: 'preventiveAction', label: 'Preventive Action', type: 'textarea', gridSize: 12 },
      { name: 'responsible', label: 'Responsible (User ID)', required: true },
      { name: 'targetDate', label: 'Target Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: opts(CAPA_STATUSES) },
    ],
  },
  reworks: {
    key: 'reworks',
    title: 'Rework',
    endpoint: '/reworks',
    searchPlaceholder: 'Search by rework number…',
    columns: [
      { id: 'reworkNumber', label: 'Rework No.' },
      refColumn('productionOrder', 'Production Order', 'orderNumber', 'orderNumber'),
      refColumn('material', 'Material'),
      { id: 'qty', label: 'Qty', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'productionOrder', label: 'Production Order ID', required: true },
      { name: 'ncr', label: 'NCR ID' },
      { name: 'material', label: 'Material ID', required: true },
      { name: 'qty', label: 'Qty', type: 'number', required: true },
      { name: 'uom', label: 'UOM', required: true },
      { name: 'reason', label: 'Reason', required: true, gridSize: 12 },
      { name: 'machine', label: 'Machine ID' },
      { name: 'status', label: 'Status', type: 'select', options: opts(REWORK_STATUSES) },
      { name: 'resultQtyOk', label: 'Result Qty OK', type: 'number' },
      { name: 'resultQtyScrap', label: 'Result Qty Scrap', type: 'number' },
    ],
  },
  'heat-treatments': {
    key: 'heat-treatments',
    title: 'Heat Treatment',
    endpoint: '/heat-treatments',
    searchPlaceholder: 'Search by process number…',
    columns: [
      { id: 'processNumber', label: 'Process No.' },
      { id: 'treatmentType', label: 'Treatment' },
      refColumn('material', 'Material'),
      { id: 'qty', label: 'Qty', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'material', label: 'Material ID', required: true },
      { name: 'qty', label: 'Qty', type: 'number', required: true },
      { name: 'uom', label: 'UOM', required: true },
      { name: 'treatmentType', label: 'Treatment Type', type: 'select', options: opts(HEAT_TREATMENT_TYPES), required: true },
      { name: 'temperature', label: 'Temperature', type: 'number' },
      { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' },
      { name: 'isOutsourced', label: 'Outsourced', type: 'boolean' },
      { name: 'vendor', label: 'Vendor (Supplier ID)' },
      { name: 'status', label: 'Status', type: 'select', options: opts(HEAT_TREATMENT_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },

  // ---------------- Purchase ----------------
  'purchase-orders': {
    key: 'purchase-orders',
    title: 'Purchase Order',
    endpoint: '/purchase-orders',
    searchPlaceholder: 'Search by PO number…',
    columns: [
      { id: 'poNumber', label: 'PO No.' },
      refColumn('supplier', 'Supplier'),
      dateColumn('orderDate', 'Order Date'),
      { id: 'totalAmount', label: 'Amount', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'supplier', label: 'Supplier ID', required: true },
      { name: 'orderDate', label: 'Order Date', type: 'date' },
      { name: 'paymentTerms', label: 'Payment Terms' },
      { name: 'status', label: 'Status', type: 'select', options: opts(PURCHASE_ORDER_STATUSES) },
      { name: 'totalAmount', label: 'Total Amount', type: 'number' },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },
  outsourcing: {
    key: 'outsourcing',
    title: 'Outsourcing',
    endpoint: '/outsourcing',
    searchPlaceholder: 'Search by outsource number…',
    columns: [
      { id: 'outsourceNumber', label: 'Outsource No.' },
      refColumn('vendor', 'Vendor'),
      refColumn('material', 'Material'),
      { id: 'qtySent', label: 'Qty Sent', align: 'right' },
      statusColumn(),
    ],
    fields: [
      { name: 'productionOrder', label: 'Production Order ID' },
      { name: 'vendor', label: 'Vendor (Supplier ID)', required: true },
      { name: 'material', label: 'Material ID', required: true },
      { name: 'qtySent', label: 'Qty Sent', type: 'number', required: true },
      { name: 'uom', label: 'UOM', required: true },
      { name: 'sentDate', label: 'Sent Date', type: 'date' },
      { name: 'expectedReturnDate', label: 'Expected Return Date', type: 'date' },
      { name: 'challanNumber', label: 'Challan Number' },
      { name: 'cost', label: 'Cost', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: opts(OUTSOURCING_STATUSES) },
      { name: 'remarks', label: 'Remarks', type: 'textarea', gridSize: 12 },
    ],
  },

  // ---------------- System ----------------
  notifications: {
    key: 'notifications',
    title: 'Notification',
    endpoint: '/notifications',
    searchPlaceholder: 'Search by title or message…',
    columns: [
      { id: 'title', label: 'Title' },
      { id: 'message', label: 'Message' },
      { id: 'type', label: 'Type' },
      boolColumn('isRead', 'Read'),
      { id: 'createdAt', label: 'Created', render: (row) => dateTimeCell(row.createdAt) },
    ],
    disableEdit: true,
    fields: [
      { name: 'recipient', label: 'Recipient (User ID)', required: true },
      { name: 'type', label: 'Type', type: 'select', options: opts(NOTIFICATION_TYPES) },
      { name: 'title', label: 'Title', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true, gridSize: 12 },
    ],
  },
  'audit-logs': {
    key: 'audit-logs',
    title: 'Audit Log',
    endpoint: '/audit-logs',
    searchPlaceholder: 'Search by action or entity type…',
    disableDelete: true,
    disableCreate: true,
    disableEdit: true,
    columns: [
      { id: 'action', label: 'Action' },
      { id: 'module', label: 'Module' },
      { id: 'entityType', label: 'Entity Type' },
      { id: 'description', label: 'Description' },
      { id: 'createdAt', label: 'When', render: (row) => dateTimeCell(row.createdAt) },
    ],
    fields: [],
  },
};

function dateTimeColumnDef(id: string, label: string): DataTableColumn<Record<string, unknown>> {
  return { id, label, render: (row) => dateTimeCell(row[id]) };
}

export function getModuleConfig(key: string | undefined): ModuleConfig | undefined {
  if (!key) return undefined;
  return MODULE_CONFIGS[key];
}

export default MODULE_CONFIGS;

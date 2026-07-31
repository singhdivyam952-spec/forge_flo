import type { User } from '../types/api';

export function hasUserPermission(user: User | null | undefined, permission?: string): boolean {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return user.permissions?.includes(permission) ?? false;
}

export function getModuleReadPermission(moduleKey?: string): string | undefined {
  if (!moduleKey) return undefined;

  const map: Record<string, string> = {
    customers: 'customers:read',
    suppliers: 'suppliers:read',
    materials: 'materials:read',
    warehouses: 'inventory:read',
    machines: 'maintenance:read',
    'work-centers': 'production:read',
    shifts: 'production:read',
    users: 'users:read',
    roles: 'roles:read',

    boms: 'engineering:read',
    routings: 'engineering:read',
    drawings: 'engineering:read',
    npd: 'engineering:read',
    'engineering-changes': 'engineering:read',

    enquiries: 'sales:read',
    rfqs: 'sales:read',
    'cost-estimations': 'sales:read',
    quotations: 'sales:read',
    'sales-orders': 'sales:read',
    packing: 'sales:read',
    dispatches: 'sales:read',

    'production-plans': 'production:read',
    'machine-allocations': 'production:read',
    'employee-allocations': 'production:read',

    'material-requisitions': 'inventory:read',
    'material-returns': 'inventory:read',
    'material-consumptions': 'inventory:read',
    'stock-transfers': 'inventory:read',

    inspections: 'quality:read',
    ncrs: 'quality:read',
    capas: 'quality:read',
    reworks: 'quality:read',
    'heat-treatments': 'quality:read',

    'purchase-orders': 'purchase:read',
    outsourcing: 'purchase:read',

    notifications: 'notifications:read',
    'audit-logs': 'auditLogs:read',
  };

  return map[moduleKey];
}

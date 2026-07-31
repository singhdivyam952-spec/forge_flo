import { DEFAULT_ROLE_PERMISSIONS, UserRole } from '../constants';

/**
 * Computes the effective permission set for a user: role defaults, plus
 * any additional permissions explicitly granted, minus any explicitly
 * revoked permissions.
 */
export function computeEffectivePermissions(
  role: UserRole,
  additionalPermissions: string[] = [],
  revokedPermissions: string[] = []
): string[] {
  const base = new Set(DEFAULT_ROLE_PERMISSIONS[role] ?? []);
  additionalPermissions.forEach((p) => base.add(p));
  revokedPermissions.forEach((p) => base.delete(p));
  return Array.from(base);
}

export function hasPermission(userPermissions: string[], required: string): boolean {
  if (userPermissions.includes(required)) return true;
  const [module] = required.split(':');
  return userPermissions.includes(`${module}:manage`);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((perm) => hasPermission(userPermissions, perm));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  return required.every((perm) => hasPermission(userPermissions, perm));
}

export default {
  computeEffectivePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
};

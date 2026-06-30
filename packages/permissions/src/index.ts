/**
 * @legacyops/permissions — RBAC for LegacyOps Console.
 *
 * Permissions are intentionally coarse-grained. Each role maps to a set of
 * permissions; a permission check is a single O(1) set lookup.
 */

import type { Role } from '@legacyops/domain';

export type Permission =
  | 'customer:read'
  | 'customer:update'
  | 'case:create'
  | 'case:update'
  | 'case:assign'
  | 'case:escalate'
  | 'billing:read'
  | 'workflow:run'
  | 'workflow:configure'
  | 'audit:read'
  | 'admin:users'
  | 'migration:run'
  | 'integration:configure';

const ALL_PERMISSIONS: Permission[] = [
  'customer:read',
  'customer:update',
  'case:create',
  'case:update',
  'case:assign',
  'case:escalate',
  'billing:read',
  'workflow:run',
  'workflow:configure',
  'audit:read',
  'admin:users',
  'migration:run',
  'integration:configure'
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  operator: ['customer:read', 'case:create', 'case:update', 'billing:read', 'workflow:run', 'audit:read'],
  senior_operator: [
    'customer:read',
    'customer:update',
    'case:create',
    'case:update',
    'case:assign',
    'case:escalate',
    'billing:read',
    'workflow:run',
    'workflow:configure',
    'audit:read'
  ],
  supervisor: [
    'customer:read',
    'customer:update',
    'case:create',
    'case:update',
    'case:assign',
    'case:escalate',
    'billing:read',
    'workflow:run',
    'workflow:configure',
    'audit:read',
    'admin:users'
  ],
  backoffice: [
    'customer:read',
    'customer:update',
    'case:update',
    'case:assign',
    'billing:read',
    'workflow:configure',
    'audit:read',
    'integration:configure'
  ],
  retention_agent: [
    'customer:read',
    'customer:update',
    'case:create',
    'case:update',
    'billing:read',
    'workflow:run',
    'audit:read'
  ],
  collections_agent: ['customer:read', 'case:create', 'case:update', 'billing:read', 'workflow:run', 'audit:read'],
  auditor: ['customer:read', 'case:update', 'audit:read', 'integration:configure'],
  admin: ALL_PERMISSIONS
};

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function can(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new PermissionDeniedError(role, permission);
  }
}

export class PermissionDeniedError extends Error {
  constructor(
    public readonly role: Role,
    public readonly permission: Permission
  ) {
    super(`Permission denied: role "${role}" lacks "${permission}"`);
    this.name = 'PermissionDeniedError';
  }
}

export const ALL_ROLES: Role[] = [
  'operator',
  'senior_operator',
  'supervisor',
  'backoffice',
  'retention_agent',
  'collections_agent',
  'auditor',
  'admin'
];

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  operator: 'Front-line call center agent. Handles customer interactions and basic cases.',
  senior_operator: 'Experienced agent. Can escalate, assign, and update customer records.',
  supervisor: 'Team lead. Manages queues, assignments, and operators.',
  backoffice: 'Back-office operator. Configures integrations and workflows.',
  retention_agent: 'Retention specialist. Runs cancellation-retention workflows.',
  collections_agent: 'Collections specialist. Manages debt and payment-promise workflows.',
  auditor: 'Read-only access for compliance and audit reviews.',
  admin: 'Full administrative access. All permissions.'
};

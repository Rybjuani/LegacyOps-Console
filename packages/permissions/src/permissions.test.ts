import { describe, it, expect } from 'vitest';
import { can, permissionsFor, assertCan, PermissionDeniedError, ROLE_PERMISSIONS } from '@legacyops/permissions';

describe('permission checks', () => {
  it('operator cannot administer users', () => {
    expect(can('operator', 'admin:users')).toBe(false);
  });

  it('admin has every permission', () => {
    expect(can('admin', 'admin:users')).toBe(true);
    expect(can('admin', 'migration:run')).toBe(true);
  });

  it('senior_operator can escalate', () => {
    expect(can('senior_operator', 'case:escalate')).toBe(true);
    expect(can('operator', 'case:escalate')).toBe(false);
  });

  it('auditor is read-only', () => {
    const perms = permissionsFor('auditor');
    expect(perms).toContain('audit:read');
    expect(perms).not.toContain('case:create');
    expect(perms).not.toContain('customer:update');
  });

  it('assertCan throws on denied permission', () => {
    expect(() => assertCan('operator', 'admin:users')).toThrow(PermissionDeniedError);
    expect(() => assertCan('admin', 'admin:users')).not.toThrow();
  });

  it('every role has at least one permission', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });
});

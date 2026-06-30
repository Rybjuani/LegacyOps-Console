/**
 * RBAC enforcement for the LegacyOps API.
 *
 * This is NOT authentication. It is a simulated role check that lets the
 * API enforce the same permission model that the `@legacyops/permissions`
 * package defines, so the API surface is consistent with the documented
 * RBAC matrix.
 *
 * The role is read from the `x-legacyops-role` header. If absent, the
 * default role is `operator` (the least-privileged operational role). This
 * is documented in README.md and docs/SECURITY_NOTES.md.
 *
 * Real SSO/OIDC/SAML integration is a tracked enterprise gap; see
 * docs/ENTERPRISE_READINESS_GAP.md.
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { assertCan, can, PermissionDeniedError, type Permission } from '@legacyops/permissions';
import type { Role } from '@legacyops/domain';
import { AuditEvents, type InMemoryAuditLog } from '@legacyops/audit';

const HEADER_NAME = 'x-legacyops-role';
export const DEFAULT_ROLE: Role = 'operator';

/**
 * Valid roles lookup. Header values that are not valid roles fall back to
 * the default role, with a warning logged — never trust client input
 * blindly.
 */
const KNOWN_ROLES: ReadonlySet<Role> = new Set<Role>([
  'operator',
  'senior_operator',
  'supervisor',
  'backoffice',
  'retention_agent',
  'collections_agent',
  'auditor',
  'admin'
]);

export function resolveRole(req: FastifyRequest): Role {
  const raw = (req.headers[HEADER_NAME] as string | undefined)?.trim();
  if (!raw) return DEFAULT_ROLE;
  if (KNOWN_ROLES.has(raw as Role)) return raw as Role;
  req.log.warn({ raw }, `Unknown role in ${HEADER_NAME} header; falling back to ${DEFAULT_ROLE}`);
  return DEFAULT_ROLE;
}

/**
 * Fastify plugin: decorates the request with `role` and `actorId`
 * (synthetic), so handlers and the `requirePermission` helper can use them
 * without re-reading the header.
 */
export async function registerRbacPlugin(app: FastifyInstance, opts: { auditLog?: InMemoryAuditLog } = {}) {
  app.decorateRequest('role', DEFAULT_ROLE);
  app.decorateRequest('actorId', 'usr_anonymous');

  app.addHook('onRequest', async (req: FastifyRequest) => {
    const role = resolveRole(req);
    (req as FastifyRequest & { role: Role }).role = role;
    (req as FastifyRequest & { actorId: string }).actorId = `usr_${role}`;
  });

  if (opts.auditLog) {
    const auditLog = opts.auditLog;
    app.addHook('onError', async (req: FastifyRequest, reply: FastifyReply, error: Error) => {
      if (error instanceof PermissionDeniedError) {
        const role = (req as FastifyRequest & { role: Role }).role;
        const actorId = (req as FastifyRequest & { actorId: string }).actorId as never;
        auditLog.append(AuditEvents.permissionDenied(actorId, role, error.permission, `${req.method} ${req.url}`));
      }
    });
  }
}

/**
 * Route-level helper. Use inside a handler to enforce a permission:
 *
 *   await requirePermission(req, reply, 'audit:read');
 *
 * On denial, replies 403 with the LegacyOps error envelope and throws to
 * stop handler execution.
 */
export async function requirePermission(
  req: FastifyRequest,
  reply: FastifyReply,
  permission: Permission
): Promise<void> {
  const role = (req as FastifyRequest & { role: Role }).role;
  if (!can(role, permission)) {
    const denied = new PermissionDeniedError(role, permission);
    await reply.status(403).send({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: `Role ${role} cannot perform ${permission}`
      }
    });
    throw denied;
  }
}

/**
 * Pre-handler wrapper for routes that want declarative enforcement:
 *
 *   app.get('/audit-events', { preHandler: withPermission('audit:read') }, handler);
 */
export function withPermission(permission: Permission) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    await requirePermission(req, reply, permission);
  };
}

/**
 * Standalone assertion that does NOT touch the reply — useful in tests or
 * non-handler contexts. Throws `PermissionDeniedError` on denial.
 */
export function assertRole(req: FastifyRequest, permission: Permission): void {
  const role = (req as FastifyRequest & { role: Role }).role;
  assertCan(role, permission);
}

/**
 * LegacyOps API — Fastify server.
 *
 * Decision: Fastify over NestJS. Fastify gives us a small, fast, dependency-
 * light HTTP layer that is enough for the synthetic demo. The route modules
 * are organised by domain so a future migration to NestJS controllers would
 * be a refactor, not a rewrite. See docs/ARCHITECTURE.md.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerHealthRoutes } from './routes/health.js';
import { registerCustomerRoutes } from './routes/customers.js';
import { registerCaseRoutes } from './routes/cases.js';
import { registerInteractionRoutes } from './routes/interactions.js';
import { registerWorkflowRoutes } from './routes/workflows.js';
import { registerAuditRoutes } from './routes/audit.js';
import { registerLegacyRoutes } from './routes/legacy.js';
import { registerSiebelMockRoutes } from './routes/siebel.js';
import { registerMigrationRoutes } from './routes/migration.js';
import { registerRoiRoutes } from './routes/roi.js';
import { AppState } from './state.js';
import { registerRbacPlugin } from './rbac.js';

export async function buildServer() {
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

  await app.register(cors, {
    origin: (process.env.CORS_ORIGIN ?? '*').split(','),
    credentials: false
  });

  const state = new AppState();

  // RBAC simulation: reads x-legacyops-role header, defaults to 'operator'.
  // Logs permission.denied audit events on 403 responses. Not auth — see
  // docs/SECURITY_NOTES.md and docs/ENTERPRISE_READINESS_GAP.md.
  await registerRbacPlugin(app, { auditLog: state.auditLog });

  await registerHealthRoutes(app, state);
  await registerCustomerRoutes(app, state);
  await registerCaseRoutes(app, state);
  await registerInteractionRoutes(app, state);
  await registerWorkflowRoutes(app, state);
  await registerAuditRoutes(app, state);
  await registerLegacyRoutes(app, state);
  await registerSiebelMockRoutes(app, state);
  await registerMigrationRoutes(app, state);
  await registerRoiRoutes(app, state);

  app.setErrorHandler((err, _req, reply) => {
    // PermissionDeniedError: expected client error, do not log at error level
    const e = err as Error & { statusCode?: number; status?: number; code?: string };
    const isPermissionDenied = e.name === 'PermissionDeniedError';
    if (!isPermissionDenied) {
      app.log.error({ err }, 'request error');
    }
    const status = e.statusCode ?? (isPermissionDenied ? 403 : e.status) ?? 500;
    reply.status(status).send({
      ok: false,
      error: {
        code: e.code ?? (isPermissionDenied ? 'FORBIDDEN' : 'INTERNAL'),
        message: e.message ?? 'Internal error'
      }
    });
  });

  return { app, state };
}

async function start() {
  if (process.env.NODE_ENV !== 'test') {
    const { app } = await buildServer();
    const port = Number(process.env.PORT ?? 3001);
    await app.listen({ port, host: '0.0.0.0' });
    console.info(`LegacyOps API listening on :${port}`);
  }
}

start().catch((e) => {
  console.error('Failed to start LegacyOps API', e);
  process.exit(1);
});

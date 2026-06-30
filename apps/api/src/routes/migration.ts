import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import {
  buildReconciliationReport,
  createDryRunReport,
  detectConflicts,
  type EntityMapping,
  type MigrationConflict
} from '@legacyops/migration';
import { withPermission } from '../rbac.js';

export async function registerMigrationRoutes(app: FastifyInstance, state: AppState) {
  app.get('/migration/source-of-truth', { preHandler: withPermission('integration:configure') }, async () => {
    return {
      sourceSystems: state.migration.sourceSystems,
      entries: state.migration.registry.list(),
      moduleStatuses: state.migration.moduleStatuses,
      idMappings: state.migration.idStore.size()
    };
  });

  app.post('/migration/dry-run', { preHandler: withPermission('migration:run') }, async (req) => {
    const body = req.body as { sourceRecords?: Record<string, unknown>[]; planId?: string };
    const sourceRecords =
      body.sourceRecords ??
      state.dataset.fakeSiebel.serviceRequests.map((sr) => ({
        Id: sr.id,
        AccountId: sr.accountId,
        ContactId: sr.contactId,
        Subject: sr.subject,
        Description: sr.description,
        Status: sr.status,
        Priority: sr.priority,
        Created: sr.created
      }));
    const result = createDryRunReport({
      plan: state.migration.plan,
      sourceRecords,
      idStore: state.migration.idStore
    });
    return result;
  });

  app.post('/migration/detect-conflicts', { preHandler: withPermission('migration:run') }, async (req) => {
    const body = req.body as { sourceRecords?: Record<string, unknown>[]; mapping?: EntityMapping };
    const sourceRecords = body.sourceRecords ?? state.dataset.fakeSiebel.serviceRequests.map((sr) => ({ Id: sr.id }));
    const mapping = body.mapping ?? state.migration.entityMapping;
    const conflicts: MigrationConflict[] = detectConflicts(sourceRecords, mapping);
    return { conflicts };
  });

  app.get('/migration/reconciliation/demo', { preHandler: withPermission('migration:run') }, async () => {
    const sourceRecords = state.dataset.fakeSiebel.serviceRequests.map((sr) => ({
      Id: sr.id,
      AccountId: sr.accountId,
      Subject: sr.subject
    }));
    const targetRecords = state.dataset.cases.map((c) => ({ id: c.id, externalId: c.externalId }));
    return buildReconciliationReport({
      runId: 'demo_run_1',
      sourceRecords,
      targetRecords,
      idStore: state.migration.idStore,
      entity: 'Case'
    });
  });

  app.get('/migration/plan', { preHandler: withPermission('integration:configure') }, async () => {
    return { plan: state.migration.plan, entityMapping: state.migration.entityMapping };
  });
}

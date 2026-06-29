import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { buildReconciliationReport, createDryRunReport, detectConflicts, type EntityMapping, type MigrationConflict } from '@legacyops/migration';

export async function registerMigrationRoutes(app: FastifyInstance, state: AppState) {
  app.get('/migration/source-of-truth', async () => {
    return {
      sourceSystems: state.migration.sourceSystems,
      entries: state.migration.registry.list(),
      moduleStatuses: state.migration.moduleStatuses,
      idMappings: state.migration.idStore.size()
    };
  });

  app.post('/migration/dry-run', async (req) => {
    const body = req.body as { sourceRecords?: Record<string, unknown>[]; planId?: string };
    const sourceRecords = body.sourceRecords ?? state.dataset.fakeSiebel.serviceRequests.map((sr) => ({
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

  app.post('/migration/detect-conflicts', async (req) => {
    const body = req.body as { sourceRecords?: Record<string, unknown>[]; mapping?: EntityMapping };
    const sourceRecords = body.sourceRecords ?? state.dataset.fakeSiebel.serviceRequests.map((sr) => ({ Id: sr.id }));
    const mapping = body.mapping ?? state.migration.entityMapping;
    const conflicts: MigrationConflict[] = detectConflicts(sourceRecords, mapping);
    return { conflicts };
  });

  app.get('/migration/reconciliation/demo', async () => {
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

  app.get('/migration/plan', async () => {
    return { plan: state.migration.plan, entityMapping: state.migration.entityMapping };
  });
}

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

  // ---------- B6: new endpoints ----------

  app.get('/migration/mappings', { preHandler: withPermission('integration:configure') }, async () => {
    return {
      entityMappings: [state.migration.entityMapping],
      sourceOfTruth: state.migration.registry.list()
    };
  });

  app.get('/migration/id-mappings', { preHandler: withPermission('integration:configure') }, async () => {
    // Expose a small preview of the ID mappings registered in the store.
    const sourceRecords = state.dataset.fakeSiebel.serviceRequests.map((sr) => ({
      Id: sr.id,
      AccountId: sr.accountId,
      Subject: sr.subject
    }));
    const mappings = sourceRecords
      .map((r) => {
        const internal = state.migration.idStore.mapExternalIdToInternalId(r.Id as never, 'siebel_like', 'Case');
        return internal ? { externalId: String(r.Id), internalId: internal, entity: 'Case' } : null;
      })
      .filter((x) => x !== null) as { externalId: string; internalId: string; entity: string }[];
    return { total: mappings.length, mappings };
  });

  app.get('/migration/conflicts/demo', { preHandler: withPermission('migration:run') }, async () => {
    // Build conflicts deterministically from the fake Siebel dataset.
    const sourceRecords = state.dataset.fakeSiebel.serviceRequests.map((sr) => ({
      Id: sr.id,
      AccountId: sr.accountId,
      Subject: sr.subject,
      Status: sr.status
    }));
    const conflicts = detectConflicts(sourceRecords, state.migration.entityMapping);
    return { total: conflicts.length, conflicts };
  });

  app.post('/migration/conflicts/resolve', { preHandler: withPermission('migration:run') }, async (req, reply) => {
    const body = req.body as {
      conflictId?: string;
      resolution?: 'skip' | 'overwrite' | 'merge' | 'manual';
      note?: string;
    } | null;
    if (!body?.conflictId || !body.resolution) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'BAD_REQUEST', message: 'conflictId and resolution are required' }
      });
    }
    // In the synthetic scaffold, conflict resolution is logged but not
    // persisted to a real store. We return a receipt the caller can
    // correlate with the audit trail.
    const receipt = {
      conflictId: body.conflictId,
      resolution: body.resolution,
      note: body.note,
      resolvedAt: new Date().toISOString(),
      receiptId: `mcr_${Math.random().toString(36).slice(2, 10)}`
    };
    state.auditLog.append({
      id: `aud_${Math.random().toString(36).slice(2, 10)}` as never,
      type: 'migration.event',
      actorId: 'usr_system' as never,
      actorRole: 'system',
      occurredAt: new Date().toISOString(),
      target: { kind: 'MigrationConflict', id: body.conflictId },
      metadata: { event: 'conflict_resolved', ...receipt }
    });
    return { ok: true, data: receipt };
  });

  app.get('/migration/rollback-plan/demo', { preHandler: withPermission('migration:run') }, async () => {
    return {
      planId: state.migration.plan.id,
      reversibleUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      steps: [
        {
          order: 1,
          action: 'Disable write-back through Siebel bridge',
          command: 'Set LEGACYOPS_MODE=workflow_wrapper'
        },
        {
          order: 2,
          action: 'Switch source-of-truth for migrated module back to siebel_like',
          command:
            'registry.register({ module: "case.billing_claim", rule: { kind: "primary", system: "siebel_like" } })'
        },
        {
          order: 3,
          action: 'Verify legacy CRM accepts writes again',
          command: 'siebel.health() + siebel.createServiceRequest(smoke)'
        },
        {
          order: 4,
          action: 'Notify operations team and freeze the migrated module for 24h',
          command: 'notifyOps("rollback_completed")'
        }
      ]
    };
  });

  app.get('/migration/module-status', { preHandler: withPermission('integration:configure') }, async () => {
    return { items: state.migration.moduleStatuses };
  });
}

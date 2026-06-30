import { describe, it, expect } from 'vitest';
import {
  buildReconciliationReport,
  createDryRunReport,
  detectConflicts,
  IdMappingStore,
  SourceOfTruthRegistry,
  validateMapping,
  type EntityMapping
} from '@legacyops/migration';

describe('migration mapping', () => {
  it('validates a correct mapping', () => {
    const m: EntityMapping = {
      id: 'em1',
      sourceSystem: 'siebel_like',
      sourceEntity: 'Service Request',
      targetEntity: 'Case',
      fields: [
        { sourceSystem: 'siebel_like', sourceField: 'Id', targetField: 'externalId' },
        { sourceSystem: 'siebel_like', sourceField: 'Subject', targetField: 'subject' }
      ]
    };
    expect(validateMapping(m)).toEqual([]);
  });

  it('detects duplicate field mappings', () => {
    const m: EntityMapping = {
      id: 'em2',
      sourceSystem: 'siebel_like',
      sourceEntity: 'SR',
      targetEntity: 'Case',
      fields: [
        { sourceSystem: 'siebel_like', sourceField: 'Id', targetField: 'externalId' },
        { sourceSystem: 'siebel_like', sourceField: 'Id', targetField: 'externalId' }
      ]
    };
    expect(validateMapping(m).length).toBeGreaterThan(0);
  });

  it('stores and resolves id mappings', () => {
    const store = new IdMappingStore();
    store.register('case_1', 'ext_sr_1' as never, 'siebel_like', 'Case');
    expect(store.mapExternalIdToInternalId('ext_sr_1' as never, 'siebel_like', 'Case')).toBe('case_1');
    expect(store.mapInternalIdToExternalId('case_1', 'Case')?.externalId).toBe('ext_sr_1');
    expect(store.size()).toBe(1);
  });

  it('detects migration conflicts', () => {
    const m: EntityMapping = {
      id: 'em3',
      sourceSystem: 'siebel_like',
      sourceEntity: 'SR',
      targetEntity: 'Case',
      fields: [{ sourceSystem: 'siebel_like', sourceField: 'Id', targetField: 'externalId' }]
    };
    const conflicts = detectConflicts([{ Id: 'a' }, { Id: 'a' }, {}], m);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts.some((c) => c.kind === 'duplicate_external_id')).toBe(true);
  });

  it('runs a dry-run and returns a structured report', () => {
    const store = new IdMappingStore();
    const plan = {
      id: 'plan_1',
      name: 'Plan',
      description: 'desc',
      sourceSystem: 'siebel_like' as const,
      entityMappings: [
        {
          id: 'em',
          sourceSystem: 'siebel_like' as const,
          sourceEntity: 'SR',
          targetEntity: 'Case',
          fields: [{ sourceSystem: 'siebel_like' as const, sourceField: 'Id', targetField: 'externalId' }]
        }
      ],
      strategy: 'dual_write' as const,
      rollbackEnabled: true,
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    const result = createDryRunReport({
      plan,
      sourceRecords: [{ Id: 'a' }, { Id: 'b' }, {}],
      idStore: store
    });
    expect(result.totalRecords).toBe(3);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('builds a reconciliation report', () => {
    const store = new IdMappingStore();
    store.register('case_1', 'ext_a' as never, 'siebel_like', 'Case');
    const r = buildReconciliationReport({
      runId: 'run_1',
      sourceRecords: [{ Id: 'ext_a' }, { Id: 'ext_b' }],
      targetRecords: [{ id: 'case_1' }],
      idStore: store,
      entity: 'Case'
    });
    expect(r.matched).toBe(1);
    expect(r.sourceCount).toBe(2);
    expect(r.targetCount).toBe(1);
  });

  it('source-of-truth registry resolves per module and field', () => {
    const r = new SourceOfTruthRegistry();
    r.register({
      module: 'customer',
      field: 'email',
      rule: { kind: 'primary', system: 'legacyops' },
      since: '2026-01-01'
    });
    r.register({ module: 'customer', rule: { kind: 'primary', system: 'siebel_like' }, since: '2026-01-01' });
    expect(r.resolve('customer', 'email')?.rule.kind).toBe('primary');
    expect(r.resolve('customer', 'email')?.rule).toMatchObject({ system: 'legacyops' });
    expect(r.resolve('customer')?.rule).toMatchObject({ system: 'siebel_like' });
  });
});

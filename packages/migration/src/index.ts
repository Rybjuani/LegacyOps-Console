/**
 * @legacyops/migration — Progressive Migration Engine.
 *
 * Models the four pillars of a safe, auditable, reversible migration:
 *   1. SourceOfTruthRegistry — who owns each field/module right now
 *   2. EntityMapping + FieldMapping — how external entities become internal
 *   3. MigrationPlan + dry-run — analyse before touching any data
 *   4. Conflict detection, reconciliation and rollback
 *
 * See docs/MIGRATION_STRATEGY.md for the full narrative.
 */

import type { ExternalId } from '@legacyops/shared';
import { id, nowIso } from '@legacyops/shared';

// ---------- Source systems & source-of-truth ----------
export type SourceSystemId = 'legacyops' | 'siebel_like' | 'billing_provider' | 'external_crm';

export interface SourceSystem {
  id: SourceSystemId;
  displayName: string;
  kind: 'primary' | 'secondary' | 'archive';
  description: string;
}

export type SourceOfTruthRule =
  | { kind: 'primary'; system: SourceSystemId }
  | { kind: 'fallback'; primary: SourceSystemId; secondary: SourceSystemId }
  | { kind: 'merge'; systems: SourceSystemId[]; mergeBy: string };

export interface SourceOfTruthEntry {
  module: string;          // e.g. "customer.identity", "case.billing_claim"
  field?: string;          // optional field-level rule
  rule: SourceOfTruthRule;
  since: string;
  notes?: string;
}

export class SourceOfTruthRegistry {
  private entries = new Map<string, SourceOfTruthEntry>();

  register(entry: SourceOfTruthEntry): void {
    const key = entry.field ? `${entry.module}#${entry.field}` : entry.module;
    this.entries.set(key, entry);
  }

  resolve(module: string, field?: string): SourceOfTruthEntry | undefined {
    if (field) return this.entries.get(`${module}#${field}`) ?? this.entries.get(module);
    return this.entries.get(module);
  }

  list(): SourceOfTruthEntry[] {
    return Array.from(this.entries.values());
  }
}

// ---------- Field & entity mappings ----------
export interface FieldMapping {
  sourceSystem: SourceSystemId;
  sourceField: string;
  targetField: string;
  transform?: 'identity' | 'uppercase' | 'lowercase' | 'date_iso' | 'currency_cents' | 'boolean';
}

export interface EntityMapping {
  id: string;
  sourceSystem: SourceSystemId;
  sourceEntity: string;        // e.g. "Service Request"
  targetEntity: string;        // e.g. "Case"
  fields: FieldMapping[];
  defaultCategory?: string;
}

export class IdMappingStore {
  private byExternal = new Map<string, { internalId: string; externalId: ExternalId; system: SourceSystemId; entity: string }>();
  private byInternal = new Map<string, { internalId: string; externalId: ExternalId; system: SourceSystemId; entity: string }>();

  register(internalId: string, externalId: ExternalId, system: SourceSystemId, entity: string): void {
    const key = `${system}:${entity}:${externalId}`;
    const rec = { internalId, externalId, system, entity };
    this.byExternal.set(key, rec);
    this.byInternal.set(`${entity}:${internalId}`, rec);
  }

  mapExternalIdToInternalId(externalId: ExternalId, system: SourceSystemId, entity: string): string | undefined {
    return this.byExternal.get(`${system}:${entity}:${externalId}`)?.internalId;
  }

  mapInternalIdToExternalId(internalId: string, entity: string): { externalId: ExternalId; system: SourceSystemId } | undefined {
    const rec = this.byInternal.get(`${entity}:${internalId}`);
    return rec ? { externalId: rec.externalId, system: rec.system } : undefined;
  }

  size(): number {
    return this.byExternal.size;
  }
}

// ---------- Plans, dry-runs, conflicts, runs ----------
export type MigrationStrategy = 'cut_over' | 'dual_write' | 'shadow' | 'read_only';

export interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  sourceSystem: SourceSystemId;
  entityMappings: EntityMapping[];
  strategy: MigrationStrategy;
  rollbackEnabled: boolean;
  createdAt: string;
}

export interface MigrationDryRunResult {
  planId: string;
  totalRecords: number;
  mapped: number;
  conflicts: MigrationConflict[];
  warnings: string[];
  estimatedSeconds: number;
  generatedAt: string;
}

export type MigrationConflictKind =
  | 'missing_required_field'
  | 'id_collision'
  | 'enum_unmapped'
  | 'duplicate_external_id'
  | 'orphaned_record'
  | 'stale_data';

export interface MigrationConflict {
  kind: MigrationConflictKind;
  sourceEntity: string;
  externalId: string;
  targetEntity: string;
  message: string;
  severity: 'warning' | 'error';
  suggestedResolution?: string;
}

export interface MigrationRun {
  id: string;
  planId: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'rolled_back';
  startedAt: string;
  completedAt?: string;
  processedRecords: number;
  conflicts: MigrationConflict[];
  rollbackPlanId?: string;
}

export interface ReconciliationReport {
  runId: string;
  sourceCount: number;
  targetCount: number;
  matched: number;
  onlyInSource: number;
  onlyInTarget: number;
  mismatches: number;
  generatedAt: string;
}

export interface RollbackPlan {
  id: string;
  runId: string;
  steps: string[];
  reversibleUntil: string;
}

export interface ModuleMigrationStatus {
  module: string;
  status: 'not_started' | 'shadow' | 'dual_write' | 'cut_over' | 'retired_legacy';
  ownerSystem: SourceSystemId;
  lastUpdated: string;
  notes?: string;
}

// ---------- Helpers ----------
export function validateMapping(mapping: EntityMapping): string[] {
  const issues: string[] = [];
  if (!mapping.sourceEntity) issues.push('sourceEntity is required');
  if (!mapping.targetEntity) issues.push('targetEntity is required');
  const seen = new Set<string>();
  for (const f of mapping.fields) {
    const k = `${f.sourceField}->${f.targetField}`;
    if (seen.has(k)) issues.push(`duplicate field mapping ${k}`);
    seen.add(k);
  }
  return issues;
}

export interface DryRunInput {
  plan: MigrationPlan;
  sourceRecords: Record<string, unknown>[];
  idStore: IdMappingStore;
}

export function createDryRunReport(input: DryRunInput): MigrationDryRunResult {
  const conflicts: MigrationConflict[] = [];
  const warnings: string[] = [];
  let mapped = 0;

  for (const rec of input.sourceRecords) {
    let missing: string[] = [];
    for (const mapping of input.plan.entityMappings) {
      for (const f of mapping.fields) {
        if (!(f.sourceField in rec)) {
          missing.push(`${mapping.sourceEntity}.${f.sourceField}`);
        }
      }
    }
    if (missing.length) {
      conflicts.push({
        kind: 'missing_required_field',
        sourceEntity: input.plan.entityMappings[0]?.sourceEntity ?? 'unknown',
        externalId: String(rec['Id'] ?? rec['id'] ?? 'unknown'),
        targetEntity: input.plan.entityMappings[0]?.targetEntity ?? 'unknown',
        message: `Missing fields: ${missing.join(', ')}`,
        severity: 'warning'
      });
    } else {
      mapped += 1;
    }

    const externalId = String(rec['Id'] ?? rec['id'] ?? '');
    if (externalId) {
      const existing = input.idStore.mapExternalIdToInternalId(externalId as ExternalId, input.plan.sourceSystem, input.plan.entityMappings[0]?.targetEntity ?? 'Case');
      if (existing) {
        conflicts.push({
          kind: 'duplicate_external_id',
          sourceEntity: input.plan.entityMappings[0]?.sourceEntity ?? 'unknown',
          externalId,
          targetEntity: input.plan.entityMappings[0]?.targetEntity ?? 'unknown',
          message: `External id ${externalId} already mapped to ${existing}`,
          severity: 'error',
          suggestedResolution: 'Skip or update existing internal record.'
        });
      }
    }
  }

  if (input.plan.strategy === 'cut_over' && !input.plan.rollbackEnabled) {
    warnings.push('cut_over strategy without rollback enabled is risky');
  }

  return {
    planId: input.plan.id,
    totalRecords: input.sourceRecords.length,
    mapped,
    conflicts,
    warnings,
    estimatedSeconds: Math.ceil(input.sourceRecords.length * 0.15),
    generatedAt: nowIso()
  };
}

export function detectConflicts(records: Record<string, unknown>[], mapping: EntityMapping): MigrationConflict[] {
  const conflicts: MigrationConflict[] = [];
  const seenIds = new Set<string>();
  for (const rec of records) {
    const id = String(rec['Id'] ?? rec['id'] ?? '');
    if (id && seenIds.has(id)) {
      conflicts.push({
        kind: 'duplicate_external_id',
        sourceEntity: mapping.sourceEntity,
        externalId: id,
        targetEntity: mapping.targetEntity,
        message: `Duplicate external id ${id}`,
        severity: 'error'
      });
    }
    if (id) seenIds.add(id);
    for (const f of mapping.fields) {
      if (!(f.sourceField in rec)) {
        conflicts.push({
          kind: 'missing_required_field',
          sourceEntity: mapping.sourceEntity,
          externalId: id || 'unknown',
          targetEntity: mapping.targetEntity,
          message: `Missing field ${f.sourceField}`,
          severity: 'warning'
        });
      }
    }
  }
  return conflicts;
}

export function mapExternalIdToInternalId(store: IdMappingStore, externalId: ExternalId, system: SourceSystemId, entity: string): string | undefined {
  return store.mapExternalIdToInternalId(externalId, system, entity);
}

export function buildReconciliationReport(input: {
  runId: string;
  sourceRecords: Record<string, unknown>[];
  targetRecords: Record<string, unknown>[];
  idStore: IdMappingStore;
  entity: string;
}): ReconciliationReport {
  const sourceIds = new Set(input.sourceRecords.map((r) => String(r['Id'] ?? r['id'] ?? '')));
  const targetIds = new Set(input.targetRecords.map((r) => String(r['id'] ?? r['Id'] ?? '')));
  const matched = input.sourceRecords.filter((r) => {
    const id = String(r['Id'] ?? r['id'] ?? '');
    return input.idStore.mapExternalIdToInternalId(id as ExternalId, 'siebel_like', input.entity);
  }).length;
  return {
    runId: input.runId,
    sourceCount: sourceIds.size,
    targetCount: targetIds.size,
    matched,
    onlyInSource: sourceIds.size - matched,
    onlyInTarget: targetIds.size - matched,
    mismatches: 0,
    generatedAt: nowIso()
  };
}

export function createRollbackPlan(runId: string, steps: string[]): RollbackPlan {
  return {
    id: id('rbp'),
    runId,
    steps,
    reversibleUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

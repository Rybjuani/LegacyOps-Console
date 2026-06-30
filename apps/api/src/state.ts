/**
 * Application state — singleton container holding the in-memory dataset,
 * the Siebel adapter (fake or real, selected via env), the audit log, the
 * metrics collector and the migration artifacts. Everything is in-memory
 * and resets on restart.
 */

import { buildDataset, buildDemoMigrationArtifacts, computeRoi, type LegacyOpsDataset } from '@legacyops/demo-data';
import { InMemoryAuditLog } from '@legacyops/audit';
import type { SiebelBridge } from '@legacyops/siebel-bridge';
import { LegacyMetricsCollector, MockSiebelMetricsCollector } from '@legacyops/legacy-observability';
import { buildSiebelAdapter, type AdapterFactoryResult } from './siebelAdapterFactory.js';

export class AppState {
  readonly dataset: LegacyOpsDataset;
  readonly auditLog: InMemoryAuditLog;
  readonly siebel: SiebelBridge;
  readonly siebelAdapterInfo: AdapterFactoryResult;
  readonly metrics: LegacyMetricsCollector;
  readonly siebelMetrics: MockSiebelMetricsCollector;
  readonly migration = buildDemoMigrationArtifacts();
  readonly roi = computeRoi();

  constructor() {
    this.dataset = buildDataset();
    this.auditLog = new InMemoryAuditLog();
    this.siebelAdapterInfo = buildSiebelAdapter(process.env, this.dataset.fakeSiebel, fetch);
    this.siebel = this.siebelAdapterInfo.adapter;
    this.metrics = new LegacyMetricsCollector();
    this.siebelMetrics = new MockSiebelMetricsCollector();
  }
}

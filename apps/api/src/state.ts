/**
 * Application state — singleton container holding the in-memory dataset,
 * the fake Siebel adapter, the audit log, the metrics collector and the
 * migration artifacts. Everything is in-memory and resets on restart.
 */

import { buildDataset, buildDemoMigrationArtifacts, computeRoi, type LegacyOpsDataset } from '@legacyops/demo-data';
import { InMemoryAuditLog } from '@legacyops/audit';
import { FakeSiebelAdapter } from '@legacyops/siebel-bridge';
import { LegacyMetricsCollector, MockSiebelMetricsCollector } from '@legacyops/legacy-observability';

export class AppState {
  readonly dataset: LegacyOpsDataset;
  readonly auditLog: InMemoryAuditLog;
  readonly siebel: FakeSiebelAdapter;
  readonly metrics: LegacyMetricsCollector;
  readonly siebelMetrics: MockSiebelMetricsCollector;
  readonly migration = buildDemoMigrationArtifacts();
  readonly roi = computeRoi();

  constructor() {
    this.dataset = buildDataset();
    this.auditLog = new InMemoryAuditLog();
    this.siebel = new FakeSiebelAdapter(this.dataset.fakeSiebel);
    this.metrics = new LegacyMetricsCollector();
    this.siebelMetrics = new MockSiebelMetricsCollector();
  }
}

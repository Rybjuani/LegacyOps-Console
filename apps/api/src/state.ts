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
    // Disable stochastic error simulation in the API's Fake Siebel Lab so
    // smoke tests and demos are deterministic. Stochastic failures can
    // still be exercised in unit tests via configureErrors({ ... }).
    this.siebel.configureErrors({
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
    this.metrics = new LegacyMetricsCollector();
    this.siebelMetrics = new MockSiebelMetricsCollector();
  }
}

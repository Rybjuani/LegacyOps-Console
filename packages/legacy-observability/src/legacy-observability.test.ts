import { describe, it, expect } from 'vitest';
import { LegacyMetricsCollector, MockSiebelMetricsCollector } from '@legacyops/legacy-observability';

describe('legacy metrics collector', () => {
  it('records and reports latencies', () => {
    const c = new LegacyMetricsCollector();
    c.recordLatency('siebel-bridge', 'searchContacts', 100);
    c.recordLatency('siebel-bridge', 'searchContacts', 200);
    c.recordLatency('siebel-bridge', 'searchContacts', 300);
    const lat = c.latencyReport();
    expect(lat.length).toBe(1);
    expect(lat[0].samples).toBe(3);
    expect(lat[0].p50Ms).toBeGreaterThanOrEqual(100);
  });

  it('records errors', () => {
    const c = new LegacyMetricsCollector();
    c.recordError({
      adapter: 'siebel-bridge',
      operation: 'invoke',
      code: 'SBL-EAI-001',
      message: 'timeout',
      retriable: true
    });
    expect(c.errorsList().length).toBe(1);
  });

  it('mock siebel check returns one of the known statuses', async () => {
    const m = new MockSiebelMetricsCollector();
    const status = await m.checkComponent('siebel_app_server');
    expect(['healthy', 'degraded', 'down']).toContain(status.status);
  });

  it('mock siebel snapshot returns metrics', () => {
    const c = new LegacyMetricsCollector();
    const m = new MockSiebelMetricsCollector();
    const snap = m.snapshot(c);
    expect(snap.length).toBeGreaterThan(0);
    expect(snap.find((s) => s.name === 'siebel_sessions_active')).toBeTruthy();
  });
});

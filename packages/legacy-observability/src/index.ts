/**
 * @legacyops/legacy-observability — Health, metrics and error events for
 * legacy/adapter layers. Strictly separated from CRM operational metrics
 * (see docs/SIEBEL_OBSERVABILITY_STRATEGY.md).
 */

import type { AdapterHealth } from '@legacyops/adapters';
import { nowIso } from '@legacyops/shared';

// ---------- Health ----------
export type LegacySystemStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface LegacyComponentStatus {
  name: string;
  status: LegacySystemStatus;
  latencyMs: number;
  message?: string;
  lastCheckedAt: string;
}

export interface LegacySystemHealth {
  system: string;
  overall: LegacySystemStatus;
  components: LegacyComponentStatus[];
  checkedAt: string;
}

export interface AdapterHealthStatus {
  adapter: string;
  health: AdapterHealth;
  consecutiveFailures: number;
  circuitOpen: boolean;
}

export interface HealthCheckProvider {
  name: string;
  check(): Promise<LegacyComponentStatus>;
}

// ---------- Metrics ----------
export type LegacyMetricType = 'counter' | 'gauge' | 'histogram';

export interface LegacyMetric {
  name: string;
  type: LegacyMetricType;
  value: number;
  unit?: string;
  labels?: Record<string, string>;
  observedAt: string;
}

export interface IntegrationLatencyMetric {
  adapter: string;
  operation: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  samples: number;
  observedAt: string;
}

export interface LegacyErrorEvent {
  id: string;
  adapter: string;
  operation: string;
  code: string;
  message: string;
  occurredAt: string;
  retriable: boolean;
  correlationId?: string;
}

// ---------- Collectors ----------
export class LegacyMetricsCollector {
  private metrics: LegacyMetric[] = [];
  private latencies = new Map<string, number[]>();
  private errors: LegacyErrorEvent[] = [];

  record(metric: LegacyMetric): void {
    this.metrics.push(metric);
  }

  recordLatency(adapter: string, operation: string, ms: number): void {
    const key = `${adapter}:${operation}`;
    const arr = this.latencies.get(key) ?? [];
    arr.push(ms);
    if (arr.length > 500) arr.shift();
    this.latencies.set(key, arr);
  }

  recordError(event: Omit<LegacyErrorEvent, 'id' | 'occurredAt'>): void {
    this.errors.push({
      ...event,
      id: `lerr_${Math.random().toString(36).slice(2, 10)}`,
      occurredAt: nowIso()
    });
    if (this.errors.length > 1000) this.errors.shift();
  }

  latencyReport(): IntegrationLatencyMetric[] {
    const out: IntegrationLatencyMetric[] = [];
    for (const [key, samples] of this.latencies) {
      const [adapter, operation] = key.split(':');
      const sorted = [...samples].sort((a, b) => a - b);
      const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
      out.push({
        adapter,
        operation,
        p50Ms: pick(0.5),
        p95Ms: pick(0.95),
        p99Ms: pick(0.99),
        samples: sorted.length,
        observedAt: nowIso()
      });
    }
    return out;
  }

  errorsList(limit = 50): LegacyErrorEvent[] {
    return this.errors.slice(-limit);
  }

  countersByLabel(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const m of this.metrics) {
      const labelKey = m.labels ? Object.values(m.labels).join('|') : '';
      const key = `${m.name}:${labelKey}`;
      out[key] = (out[key] ?? 0) + m.value;
    }
    return out;
  }

  snapshot(): { metrics: LegacyMetric[]; latencies: IntegrationLatencyMetric[]; errors: LegacyErrorEvent[] } {
    return {
      metrics: this.metrics.slice(-200),
      latencies: this.latencyReport(),
      errors: this.errorsList()
    };
  }
}

// ---------- Mock Siebel metrics ----------
export interface MockSiebelMetricsConfig {
  componentStatuses: { name: string; baseLatencyMs: number; failureRate: number }[];
  sessionCount: number;
  queueDepth: number;
  availability: number; // 0..1
}

export const DEFAULT_MOCK_CFG: MockSiebelMetricsConfig = {
  componentStatuses: [
    { name: 'siebel_gateway', baseLatencyMs: 80, failureRate: 0.01 },
    { name: 'siebel_app_server', baseLatencyMs: 150, failureRate: 0.02 },
    { name: 'siebel_db', baseLatencyMs: 90, failureRate: 0.005 },
    { name: 'siebel_eai', baseLatencyMs: 220, failureRate: 0.05 },
    { name: 'siebel_integration_layer', baseLatencyMs: 180, failureRate: 0.03 }
  ],
  sessionCount: 142,
  queueDepth: 17,
  availability: 0.992
};

export class MockSiebelMetricsCollector {
  constructor(private cfg: MockSiebelMetricsConfig = DEFAULT_MOCK_CFG) {}

  async checkComponent(name: string): Promise<LegacyComponentStatus> {
    const c = this.cfg.componentStatuses.find((x) => x.name === name);
    if (!c) {
      return { name, status: 'unknown', latencyMs: 0, lastCheckedAt: nowIso() };
    }
    const jitter = Math.floor(Math.random() * 80);
    const latency = c.baseLatencyMs + jitter;
    const failed = Math.random() < c.failureRate;
    return {
      name: c.name,
      status: failed ? 'down' : latency > c.baseLatencyMs * 2 ? 'degraded' : 'healthy',
      latencyMs: latency,
      message: failed ? 'simulated failure' : undefined,
      lastCheckedAt: nowIso()
    };
  }

  async checkAll(): Promise<LegacySystemHealth> {
    const components = await Promise.all(this.cfg.componentStatuses.map((c) => this.checkComponent(c.name)));
    const overall: LegacySystemStatus = components.some((c) => c.status === 'down')
      ? 'down'
      : components.some((c) => c.status === 'degraded')
        ? 'degraded'
        : 'healthy';
    return {
      system: 'siebel_like',
      overall,
      components,
      checkedAt: nowIso()
    };
  }

  snapshot(collector: LegacyMetricsCollector): LegacyMetric[] {
    return [
      { name: 'siebel_sessions_active', type: 'gauge', value: this.cfg.sessionCount, unit: 'sessions', observedAt: nowIso() },
      { name: 'siebel_queue_depth', type: 'gauge', value: this.cfg.queueDepth, unit: 'items', observedAt: nowIso() },
      { name: 'siebel_availability', type: 'gauge', value: this.cfg.availability, unit: 'ratio', observedAt: nowIso() },
      { name: 'siebel_failed_calls_total', type: 'counter', value: collector.errorsList(1000).length, observedAt: nowIso() }
    ];
  }
}

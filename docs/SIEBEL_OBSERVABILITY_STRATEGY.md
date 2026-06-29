# Siebel Observability Strategy

> How LegacyOps observes the health of legacy/adapter layers — strictly
> separated from CRM operational metrics.

---

## 1. Two metric domains, never mixed

| Domain | Owner | Examples |
|--------|-------|----------|
| Operational CRM metrics | LegacyOps core | Cases per agent, FCR, AHT, escalations, workflow completion. |
| Legacy / adapter metrics | Legacy observability layer | Adapter latency, failed external calls, session count, queue depth, legacy component health. |

Mixing them is a classic anti-pattern: a legacy outage should not be
reported as a CRM KPI regression. LegacyOps keeps them in separate
collectors and separate dashboards.

---

## 2. Health checks

`MockSiebelMetricsCollector.checkAll()` returns a `LegacySystemHealth`:

```ts
{
  system: 'siebel_like',
  overall: 'healthy' | 'degraded' | 'down',
  components: [
    { name: 'siebel_gateway', status: 'healthy', latencyMs: 80, lastCheckedAt: '...' },
    { name: 'siebel_app_server', status: 'degraded', latencyMs: 320, lastCheckedAt: '...' },
    { name: 'siebel_db', status: 'healthy', latencyMs: 90, lastCheckedAt: '...' },
    { name: 'siebel_eai', status: 'healthy', latencyMs: 220, lastCheckedAt: '...' }
  ],
  checkedAt: '...'
}
```

A real deployment would replace `MockSiebelMetricsCollector` with a
concrete adapter that pings each component.

---

## 3. Adapter latency

`LegacyMetricsCollector.recordLatency(adapter, operation, ms)` keeps a
rolling 500-sample window per (adapter, operation) pair and reports p50,
p95, p99.

Example:

```ts
collector.latencyReport();
// [
//   { adapter: 'siebel-bridge', operation: 'searchContacts', p50Ms: 120, p95Ms: 240, p99Ms: 380, samples: 87 }
// ]
```

---

## 4. Failed external calls

Every adapter call that throws is recorded as a `LegacyErrorEvent`:

```ts
{
  id: 'lerr_abc',
  adapter: 'siebel-bridge',
  operation: 'invoke',
  code: 'SBL-EAI-001',
  message: 'Integration layer timeout',
  occurredAt: '...',
  retriable: true,
  correlationId: '...'
}
```

The audit log also receives an `external.adapter_call` event so failed
external calls are correlated with operator actions.

---

## 5. Prometheus-style metrics

The collector exposes counters and gauges suitable for Prometheus
scraping. A real deployment would expose `/metrics` in the API; the
scaffold exposes them through `/legacy/metrics` as JSON.

Sample metrics:

- `siebel_sessions_active` (gauge)
- `siebel_queue_depth` (gauge)
- `siebel_availability` (gauge, 0..1)
- `siebel_failed_calls_total` (counter)
- `adapter_latency_ms{adapter,operation,quantile}` (histogram)

---

## 6. Operational events

LegacyOps separates:

- **Operational CRM events** — `case.created`, `workflow.completed`,
  `customer.viewed`. Stored in the audit log.
- **Legacy / adapter events** — `external.adapter_call`,
  `legacy.error`, `migration.event`. Stored in both the audit log and the
  metrics collector.

This separation lets a compliance reviewer trace an operator action end
to end (audit log) while a Site Reliability Engineer can focus on adapter
health (metrics collector).

---

## 7. Dashboard layout

The Legacy Observability dashboard (`apps/web/src/pages/LegacyObservabilityPage.tsx`)
shows:

- Overall system health and per-component status.
- Adapter latency table (p50, p95, p99, samples).
- Recent errors.
- Legacy metrics (sessions, queue, availability, failed calls).

It deliberately does **not** show CRM operational KPIs (those live in the
Supervisor dashboard).

---

## 8. Future: real backend integration

When a real Siebel REST endpoint is available, the same dashboard works
unchanged because the observability layer talks to
`ObservabilityAdapter` and `HealthCheckProvider` contracts, not to any
concrete backend. A `RealSiebelMetricsCollector` would implement
`HealthCheckProvider` for each component.

---

## 9. Anti-patterns avoided

- ❌ Treating adapter latency as a CRM KPI.
- ❌ Mixing operator productivity metrics with system health metrics in
  the same chart.
- ❌ Relying on a single Prometheus exporter for everything (LegacyOps
  needs adapter-level metrics, not just Siebel server metrics).
- ❌ Silencing adapter errors inside business logic — they are always
  surfaced to the operator and recorded.

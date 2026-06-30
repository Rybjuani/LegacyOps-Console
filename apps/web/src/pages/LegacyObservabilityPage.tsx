import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SectionHeader, TechnicalBanner } from '../components/ui';

interface Health {
  system: string;
  overall: string;
  components: { name: string; status: string; latencyMs: number; message?: string; lastCheckedAt: string }[];
  checkedAt: string;
}
interface Metrics {
  operational: {
    metrics: { name: string; value: number; unit?: string }[];
    latencies: { adapter: string; operation: string; p50Ms: number; p95Ms: number; p99Ms: number; samples: number }[];
    errors: { id: string; adapter: string; code: string; message: string }[];
  };
  legacy: { name: string; value: number; unit?: string }[];
}

export function LegacyObservabilityPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.get<Health>('/legacy/health').then(setHealth);
    api.get<Metrics>('/legacy/metrics').then(setMetrics);
  }, []);

  return (
    <div>
      <SectionHeader
        title="Legacy Observability"
        subtitle="Health, latency and errors of the legacy/adapter layer. Strictly separated from CRM operational metrics."
      />
      <TechnicalBanner>These tools are for developers, architects and migration teams.</TechnicalBanner>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>System health</h3>
          {health ? (
            <>
              <p>
                Overall:{' '}
                <span
                  className={`pill ${health.overall === 'healthy' ? 'ok' : health.overall === 'degraded' ? 'warn' : 'danger'}`}
                >
                  {health.overall}
                </span>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {health.components.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td>
                        <span
                          className={`pill ${c.status === 'healthy' ? 'ok' : c.status === 'degraded' ? 'warn' : 'danger'}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>{c.latencyMs}ms</td>
                      <td className="muted">{c.message ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <span className="muted">Loading…</span>
          )}
        </div>
        <div className="panel">
          <h3>Legacy metrics</h3>
          {metrics ? (
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {metrics.legacy.map((m) => (
                  <tr key={m.name}>
                    <td>{m.name}</td>
                    <td>{m.value}</td>
                    <td className="muted">{m.unit ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span className="muted">Loading…</span>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <h3>Adapter latency</h3>
          {metrics ? (
            <table>
              <thead>
                <tr>
                  <th>Adapter</th>
                  <th>Operation</th>
                  <th>p50</th>
                  <th>p95</th>
                  <th>p99</th>
                  <th>Samples</th>
                </tr>
              </thead>
              <tbody>
                {metrics.operational.latencies.map((l) => (
                  <tr key={`${l.adapter}:${l.operation}`}>
                    <td>{l.adapter}</td>
                    <td>{l.operation}</td>
                    <td>{l.p50Ms}ms</td>
                    <td>{l.p95Ms}ms</td>
                    <td>{l.p99Ms}ms</td>
                    <td>{l.samples}</td>
                  </tr>
                ))}
                {metrics.operational.latencies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      No latency samples yet. Generate traffic by invoking a business service.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <span className="muted">Loading…</span>
          )}
        </div>
        <div className="panel">
          <h3>Recent errors</h3>
          {metrics && metrics.operational.errors.length === 0 ? (
            <p className="muted">No errors recorded.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Adapter</th>
                  <th>Code</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {metrics?.operational.errors.slice(-10).map((e) => (
                  <tr key={e.id}>
                    <td>{e.adapter}</td>
                    <td>{e.code}</td>
                    <td className="muted">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

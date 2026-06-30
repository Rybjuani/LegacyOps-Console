import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ErrorState, LoadingState, SectionHeader, SuccessBanner } from '../components/ui';

interface DashboardData {
  customers: { total: number; items: unknown[] };
  cases: { items: unknown[] };
  health: { status: string };
  workflows: { items: unknown[] };
  audit: { total: number };
  adapterStatus?: { mode: string; realConfigured: boolean; warning?: string };
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ total: number; items: unknown[] }>('/customers?pageSize=1'),
      api.get<{ items: unknown[] }>('/cases'),
      api.get<{ status: string }>('/health'),
      api.get<{ items: unknown[] }>('/workflows'),
      api.get<{ total: number }>('/audit-events?pageSize=1'),
      api.get<{ mode: string; realConfigured: boolean; warning?: string }>('/siebel/adapter/status').catch(() => null)
    ])
      .then(([customers, cases, health, workflows, audit, adapterStatus]) => {
        setData({
          customers,
          cases,
          health,
          workflows,
          audit: { total: audit.total },
          adapterStatus: adapterStatus ?? undefined
        });
      })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <ErrorState message={`Failed to load: ${err}`} />;
  if (!data) return <LoadingState />;

  const openCases = data.cases.items.length;

  return (
    <div>
      <SectionHeader title="Today's Operations" subtitle="A quick snapshot of what is happening right now." />

      <div className="grid grid-4 mb">
        <div className="panel kpi">
          <span className="label">Customers</span>
          <span className="value">{data.customers.total}</span>
        </div>
        <div className="panel kpi">
          <span className="label">Open cases</span>
          <span className="value">{openCases}</span>
        </div>
        <div className="panel kpi">
          <span className="label">Workflows</span>
          <span className="value">{data.workflows.items.length}</span>
        </div>
        <div className="panel kpi">
          <span className="label">Audit events</span>
          <span className="value">{data.audit.total}</span>
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Operator flow</h3>
          <p className="muted">Guide an operator from customer verification to case closure.</p>
          <Link to="/interaction-console" className="btn" style={{ display: 'inline-block', marginTop: 12 }}>
            Open Interaction Console
          </Link>
        </div>
        <div className="panel">
          <h3>Legacy readiness</h3>
          <p className="muted">
            Bridge status: <span className="pill ok">{data.health.status}</span>
          </p>
          {data.adapterStatus && (
            <p className="muted">
              Mode:{' '}
              <span className="pill accent">{data.adapterStatus.realConfigured ? 'Real adapter' : 'Fake Lab'}</span>
            </p>
          )}
          <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
            The bridge talks to a synthetic Siebel-like backend by default. Real adapter validation is pending.
          </p>
        </div>
      </div>

      <SuccessBanner>
        <strong>Why this matters</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          <li>Reduce operator screen switching.</li>
          <li>Wrap legacy CRM without replacing it immediately.</li>
          <li>Measure migration ROI before a risky rewrite.</li>
        </ul>
      </SuccessBanner>
    </div>
  );
}

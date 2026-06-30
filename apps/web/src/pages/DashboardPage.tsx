import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface DashboardData {
  customers: { total: number; items: unknown[] };
  cases: { items: unknown[] };
  health: { status: string };
  workflows: { items: unknown[] };
  audit: { total: number };
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
      api.get<{ total: number }>('/audit-events?pageSize=1')
    ])
      .then(([customers, cases, health, workflows, audit]) => {
        setData({ customers, cases, health, workflows, audit: { total: audit.total } });
      })
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="banner warn">Failed to load: {err}</div>;
  if (!data) return <div className="muted">Loading…</div>;

  return (
    <div>
      <h1 className="page-title">Operational Dashboard</h1>
      <p className="page-subtitle">High-level snapshot of the LegacyOps CRM core and the Siebel-like bridge.</p>

      <div className="grid grid-4 mb">
        <div className="panel kpi">
          <span className="label">Customers</span>
          <span className="value">{data.customers.total}</span>
        </div>
        <div className="panel kpi">
          <span className="label">Open cases</span>
          <span className="value">{data.cases.items.length}</span>
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

      <div className="grid grid-2">
        <div className="panel">
          <h3>Bridge health</h3>
          <p className="muted">
            Status: <span className="pill ok">{data.health.status}</span>
          </p>
          <p className="muted">
            The Siebel-like bridge is running in synthetic mode. All endpoints serve fictional data from the in-memory
            Fake Siebel Lab.
          </p>
        </div>
        <div className="panel">
          <h3>What makes LegacyOps different</h3>
          <ul className="list-clean">
            <li>Own CRM domain — Customer, Account, Case, Workflow, Audit.</li>
            <li>Anti-corruption layer keeps the domain free of Siebel coupling.</li>
            <li>Migration engine with dry-runs, conflicts, reconciliation, rollback.</li>
            <li>Legacy observability separated from operational metrics.</li>
            <li>ROI metrics baked in — measure savings before/after pilot.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

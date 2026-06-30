import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { WorkflowDefinition, WorkflowRun } from '@legacyops/domain';
import { SectionHeader } from '../components/ui';

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selected, setSelected] = useState<WorkflowDefinition | null>(null);
  const [customerId, setCustomerId] = useState('cust_res_1');

  useEffect(() => {
    api.get<{ items: WorkflowDefinition[] }>('/workflows').then((r) => {
      setWorkflows(r.items);
      setSelected(r.items[0] ?? null);
    });
    api.get<{ items: WorkflowRun[] }>('/workflow-runs').then((r) => setRuns(r.items));
  }, []);

  function start() {
    if (!selected) return;
    api
      .post<{ ok: true; data: WorkflowRun }>(`/workflows/${selected.id}/start`, {
        customerId,
        agentId: 'usr_operator1'
      })
      .then((r) => setRuns((prev) => [r.data, ...prev]));
  }

  return (
    <div>
      <SectionHeader
        title="Workflows"
        subtitle="Guided operator workflows. Each step declares its required fields and is fully audited."
      />

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Available workflows</h3>
          <ul className="list-clean">
            {workflows.map((w) => (
              <li key={w.id} className="row between">
                <span>
                  {w.name} <span className="muted">— {w.category}</span>
                </span>
                <button className="btn secondary" onClick={() => setSelected(w)}>
                  Select
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Start a run</h3>
          <div className="col">
            <label className="muted">Workflow</label>
            <strong>{selected?.name ?? '—'}</strong>
            <label className="muted">Customer ID</label>
            <input className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
            <button className="btn" onClick={start}>
              Start workflow
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="panel mb">
          <h3>Steps — {selected.name}</h3>
          <div className="stepper">
            {selected.steps.map((s) => (
              <div key={s.id} className="step">
                <div className="step-id">{s.id}</div>
                <div className="step-label">{s.label}</div>
                <div className="muted">{s.description}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Required: {s.requiredFields.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h3>Recent runs ({runs.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Run</th>
              <th>Workflow</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Started</th>
              <th>Steps</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="muted">{r.id.slice(0, 18)}…</td>
                <td>{r.workflowName}</td>
                <td className="muted">{r.customerId}</td>
                <td>
                  <span className={`pill ${r.status === 'completed' ? 'ok' : r.status === 'active' ? 'accent' : ''}`}>
                    {r.status}
                  </span>
                </td>
                <td className="muted">{r.startedAt.slice(0, 16).replace('T', ' ')}</td>
                <td>
                  {r.steps.filter((s) => s.status === 'completed').length}/{r.steps.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

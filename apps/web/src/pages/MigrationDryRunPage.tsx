import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface DryRun {
  planId: string;
  totalRecords: number;
  mapped: number;
  conflicts: {
    kind: string;
    sourceEntity: string;
    externalId: string;
    targetEntity: string;
    message: string;
    severity: string;
    suggestedResolution?: string;
  }[];
  warnings: string[];
  estimatedSeconds: number;
  generatedAt: string;
}
interface Reconciliation {
  runId: string;
  sourceCount: number;
  targetCount: number;
  matched: number;
  onlyInSource: number;
  onlyInTarget: number;
  mismatches: number;
  generatedAt: string;
}
interface Plan {
  plan: {
    id: string;
    name: string;
    description: string;
    sourceSystem: string;
    strategy: string;
    rollbackEnabled: boolean;
  };
  entityMapping: {
    sourceEntity: string;
    targetEntity: string;
    fields: { sourceField: string; targetField: string; transform?: string }[];
  };
}

export function MigrationDryRunPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [recon, setRecon] = useState<Reconciliation | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    api.get<Plan>('/migration/plan').then(setPlan);
    api.get<Reconciliation>('/migration/reconciliation/demo').then(setRecon);
  }, []);

  function runDry() {
    setRunning(true);
    api
      .post<DryRun>('/migration/dry-run', {})
      .then(setDryRun)
      .finally(() => setRunning(false));
  }

  return (
    <div>
      <h1 className="page-title">Migration Dry Run</h1>
      <p className="page-subtitle">
        Plan, validate, detect conflicts and reconcile — before any data is moved. Every migration is auditable and
        reversible.
      </p>

      {plan && (
        <div className="panel mb">
          <h3>Plan — {plan.plan.name}</h3>
          <p className="muted">{plan.plan.description}</p>
          <div className="grid grid-4">
            <div className="kpi">
              <span className="label">Source</span>
              <span className="value">{plan.plan.sourceSystem}</span>
            </div>
            <div className="kpi">
              <span className="label">Strategy</span>
              <span className="value">{plan.plan.strategy}</span>
            </div>
            <div className="kpi">
              <span className="label">Rollback</span>
              <span className="value">{plan.plan.rollbackEnabled ? 'enabled' : 'disabled'}</span>
            </div>
            <div className="kpi">
              <span className="label">Mapped fields</span>
              <span className="value">{plan.entityMapping.fields.length}</span>
            </div>
          </div>
          <h3 style={{ marginTop: 16 }}>
            Field mapping — {plan.entityMapping.sourceEntity} → {plan.entityMapping.targetEntity}
          </h3>
          <table>
            <thead>
              <tr>
                <th>Source field</th>
                <th>Target field</th>
                <th>Transform</th>
              </tr>
            </thead>
            <tbody>
              {plan.entityMapping.fields.map((f) => (
                <tr key={f.sourceField}>
                  <td>{f.sourceField}</td>
                  <td>{f.targetField}</td>
                  <td className="muted">{f.transform ?? 'identity'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Dry-run report</h3>
          <button className="btn" onClick={runDry} disabled={running}>
            {running ? 'Running…' : 'Run dry-run'}
          </button>
          {dryRun && (
            <div className="mt">
              <div className="grid grid-4">
                <div className="kpi">
                  <span className="label">Total records</span>
                  <span className="value">{dryRun.totalRecords}</span>
                </div>
                <div className="kpi">
                  <span className="label">Mapped</span>
                  <span className="value">{dryRun.mapped}</span>
                </div>
                <div className="kpi">
                  <span className="label">Conflicts</span>
                  <span className="value">{dryRun.conflicts.length}</span>
                </div>
                <div className="kpi">
                  <span className="label">Est. seconds</span>
                  <span className="value">{dryRun.estimatedSeconds}</span>
                </div>
              </div>
              {dryRun.warnings.length > 0 && (
                <div className="banner warn" style={{ marginTop: 12 }}>
                  {dryRun.warnings.join(' · ')}
                </div>
              )}
              {dryRun.conflicts.length > 0 && (
                <table style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Kind</th>
                      <th>External ID</th>
                      <th>Message</th>
                      <th>Resolution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dryRun.conflicts.slice(0, 12).map((c, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`pill ${c.severity === 'error' ? 'danger' : 'warn'}`}>{c.severity}</span>
                        </td>
                        <td>{c.kind}</td>
                        <td className="muted">{c.externalId}</td>
                        <td>{c.message}</td>
                        <td className="muted">{c.suggestedResolution ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        <div className="panel">
          <h3>Reconciliation (demo)</h3>
          {recon ? (
            <div className="grid grid-3">
              <div className="kpi">
                <span className="label">Source</span>
                <span className="value">{recon.sourceCount}</span>
              </div>
              <div className="kpi">
                <span className="label">Target</span>
                <span className="value">{recon.targetCount}</span>
              </div>
              <div className="kpi">
                <span className="label">Matched</span>
                <span className="value">{recon.matched}</span>
              </div>
              <div className="kpi">
                <span className="label">Only in source</span>
                <span className="value">{recon.onlyInSource}</span>
              </div>
              <div className="kpi">
                <span className="label">Only in target</span>
                <span className="value">{recon.onlyInTarget}</span>
              </div>
              <div className="kpi">
                <span className="label">Mismatches</span>
                <span className="value">{recon.mismatches}</span>
              </div>
            </div>
          ) : (
            <span className="muted">Loading…</span>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SectionHeader, TechnicalBanner } from '../components/ui';

interface SoT {
  sourceSystems: { id: string; displayName: string; kind: string; description: string }[];
  entries: {
    module: string;
    field?: string;
    rule: { kind: string; system?: string; primary?: string; secondary?: string; systems?: string[]; mergeBy?: string };
    since: string;
    notes?: string;
  }[];
  moduleStatuses: { module: string; status: string; ownerSystem: string; lastUpdated: string; notes?: string }[];
  idMappings: number;
}

export function SourceOfTruthPage() {
  const [sot, setSot] = useState<SoT | null>(null);

  useEffect(() => {
    api.get<SoT>('/migration/source-of-truth').then(setSot);
  }, []);

  if (!sot) return <div className="muted">Loading…</div>;

  return (
    <div>
      <SectionHeader
        title="Source of Truth Map"
        subtitle="For each module or field, who owns the truth right now? The registry drives the anti-corruption layer and the migration engine."
      />
      <TechnicalBanner>These tools are for developers, architects and migration teams.</TechnicalBanner>

      <div className="grid grid-3 mb">
        {sot.sourceSystems.map((s) => (
          <div key={s.id} className="panel">
            <h3>{s.displayName}</h3>
            <p className="muted">{s.id}</p>
            <p>
              <span className="pill accent">{s.kind}</span>
            </p>
            <p className="muted">{s.description}</p>
          </div>
        ))}
      </div>

      <div className="panel mb">
        <h3>Source-of-truth entries ({sot.entries.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Field</th>
              <th>Rule</th>
              <th>Since</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sot.entries.map((e, i) => (
              <tr key={i}>
                <td>{e.module}</td>
                <td className="muted">{e.field ?? '—'}</td>
                <td>
                  <code>
                    {e.rule.kind === 'primary' && `primary → ${e.rule.system}`}
                    {e.rule.kind === 'fallback' && `fallback primary=${e.rule.primary} secondary=${e.rule.secondary}`}
                    {e.rule.kind === 'merge' && `merge [${e.rule.systems?.join(', ')}] by ${e.rule.mergeBy}`}
                  </code>
                </td>
                <td className="muted">{e.since}</td>
                <td className="muted">{e.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <h3>Module migration status</h3>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Last update</th>
              </tr>
            </thead>
            <tbody>
              {sot.moduleStatuses.map((m) => (
                <tr key={m.module}>
                  <td>{m.module}</td>
                  <td>
                    <span className="pill accent">{m.status}</span>
                  </td>
                  <td className="muted">{m.ownerSystem}</td>
                  <td className="muted">{m.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>ID mappings</h3>
          <p className="kpi">
            <span className="label">Registered external→internal mappings</span>
            <span className="value">{sot.idMappings}</span>
          </p>
          <p className="muted">
            The ID mapping store is the bridge that lets the migration engine reconcile external records with internal
            ones without losing traceability.
          </p>
        </div>
      </div>
    </div>
  );
}

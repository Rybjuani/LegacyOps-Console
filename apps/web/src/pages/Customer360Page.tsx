import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Account, Case, ContactMethod, Contract, Customer, DebtRecord, Service } from '@legacyops/domain';
import { DataSourceBadge, ErrorState, LoadingState, SectionHeader, type DataSourceBadgeKind } from '../components/ui';

interface Customer360 {
  customer: Customer;
  account: Account;
  contactMethods: ContactMethod[];
  contracts: Contract[];
  services: Service[];
  debts: DebtRecord[];
}

function sourceForCustomer(c: Customer): DataSourceBadgeKind {
  return c.externalId ? 'legacy' : 'native';
}
function sourceForAccount(a: Account): DataSourceBadgeKind {
  return a.externalId ? 'legacy' : 'native';
}
function sourceForService(s: Service): DataSourceBadgeKind {
  return s.externalId ? 'legacy' : 'native';
}
function sourceForCase(c: Case): DataSourceBadgeKind {
  return c.externalId ? 'mapped' : 'native';
}

export function Customer360Page() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Customer360 | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [timeline, setTimeline] = useState<{ items: { kind: string; at: string; item: unknown }[] } | null>(null);
  const [billing, setBilling] = useState<{
    invoices: unknown[];
    payments: unknown[];
    debts: unknown[];
    totalDue: number;
    currency: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setErr(null);
    Promise.all([
      api.get<Customer360>(`/customers/${id}`),
      api.get<{ items: Case[] }>(`/customers/${id}/cases`),
      api.get<{ items: { kind: string; at: string; item: unknown }[] }>(`/customers/${id}/timeline`),
      api.get<{ invoices: unknown[]; payments: unknown[]; debts: unknown[]; totalDue: number; currency: string }>(
        `/customers/${id}/billing`
      )
    ])
      .then(([d, c, t, b]) => {
        setData(d);
        setCases(c.items);
        setTimeline(t);
        setBilling(b);
      })
      .catch((e) => setErr(String(e)));
  }, [id]);

  if (err) return <ErrorState message={err} />;
  if (!data) return <LoadingState />;
  const c = data.customer;

  return (
    <div>
      <div className="row between">
        <SectionHeader title={c.displayName} subtitle={`Customer ID: ${c.id}`} />
        <Link to="/customers" className="btn secondary">
          ← Back to search
        </Link>
      </div>

      <div className="mb">
        <span className="pill accent" style={{ marginRight: 8 }}>
          {c.segment}
        </span>
        {c.riskFlags.map((f) => (
          <span key={f} className="pill warn" style={{ marginRight: 8 }}>
            {f.replace(/_/g, ' ')}
          </span>
        ))}
        {c.externalId && (
          <span className="muted" style={{ marginRight: 12 }}>
            External ID (legacy): {c.externalId}
          </span>
        )}
        <DataSourceBadge kind={sourceForCustomer(c)} />
      </div>

      <p className="muted mb" style={{ fontSize: 12 }}>
        Data source badges show where this information comes from during a migration: <strong>Native</strong>{' '}
        (LegacyOps), <strong>Legacy</strong> (Siebel-like), <strong>Mapped</strong> (migrated from legacy).
      </p>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Identity</h3>
          <table>
            <tbody>
              <tr>
                <th>Display name</th>
                <td>{c.displayName}</td>
              </tr>
              <tr>
                <th>Document</th>
                <td className="muted">{c.documentNumber ?? '—'}</td>
              </tr>
              <tr>
                <th>Email</th>
                <td className="muted">{c.email ?? '—'}</td>
              </tr>
              <tr>
                <th>Phone</th>
                <td className="muted">{c.phone ?? '—'}</td>
              </tr>
              <tr>
                <th>Source</th>
                <td>
                  <DataSourceBadge kind={sourceForCustomer(c)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Account</h3>
          <table>
            <tbody>
              <tr>
                <th>Status</th>
                <td>
                  <span className={`pill ${data.account.status === 'active' ? 'ok' : 'warn'}`}>
                    {data.account.status}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Currency</th>
                <td>{data.account.currency}</td>
              </tr>
              <tr>
                <th>Opened</th>
                <td className="muted">{data.account.openedAt.slice(0, 10)}</td>
              </tr>
              <tr>
                <th>External ID</th>
                <td className="muted">{data.account.externalId ?? '—'}</td>
              </tr>
              <tr>
                <th>Source</th>
                <td>
                  <DataSourceBadge kind={sourceForAccount(data.account)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Services / Assets</h3>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Since</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((s) => (
                <tr key={s.id}>
                  <td>{s.productId}</td>
                  <td>
                    <span className={`pill ${s.status === 'active' ? 'ok' : 'warn'}`}>{s.status}</span>
                  </td>
                  <td className="muted">{s.activatedAt.slice(0, 10)}</td>
                  <td>
                    <DataSourceBadge kind={sourceForService(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Billing</h3>
          {billing ? (
            <>
              <div className="grid grid-2">
                <div className="kpi">
                  <span className="label">Total due</span>
                  <span className="value">
                    {billing.currency} {billing.totalDue}
                  </span>
                </div>
                <div className="kpi">
                  <span className="label">Invoices</span>
                  <span className="value">{billing.invoices.length}</span>
                </div>
                <div className="kpi">
                  <span className="label">Payments</span>
                  <span className="value">{billing.payments.length}</span>
                </div>
                <div className="kpi">
                  <span className="label">Debts</span>
                  <span className="value">{billing.debts.length}</span>
                </div>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                <DataSourceBadge kind="synthetic" /> Billing data served by the synthetic billing mock.
              </p>
            </>
          ) : (
            <LoadingState />
          )}
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Open Cases ({cases.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((cs) => (
                <tr key={cs.id}>
                  <td>{cs.subject}</td>
                  <td>
                    <span className="pill">{cs.status}</span>
                  </td>
                  <td>
                    <span
                      className={`pill ${cs.priority === 'urgent' ? 'danger' : cs.priority === 'high' ? 'warn' : ''}`}
                    >
                      {cs.priority}
                    </span>
                  </td>
                  <td>
                    <DataSourceBadge kind={sourceForCase(cs)} />
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No cases for this customer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Recent Interactions</h3>
          {timeline && timeline.items.length > 0 ? (
            <ul className="list-clean">
              {timeline.items.slice(0, 12).map((it, i) => {
                const item = it.item as { subject?: string; reason?: string; summary?: string };
                return (
                  <li key={i} className="row between">
                    <span>
                      <span className="pill accent" style={{ marginRight: 8 }}>
                        {it.kind}
                      </span>
                      {item.subject ?? item.reason ?? item.summary ?? '—'}
                    </span>
                    <span className="muted">{it.at.slice(0, 16).replace('T', ' ')}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No interactions recorded for this customer.</p>
          )}
        </div>
      </div>

      <div className="panel">
        <h3>Risk Signals</h3>
        <table>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {c.riskFlags.length === 0 ? (
              <tr>
                <td colSpan={2} className="muted">
                  No risk signals.
                </td>
              </tr>
            ) : (
              c.riskFlags.map((f) => (
                <tr key={f}>
                  <td>{f.replace(/_/g, ' ')}</td>
                  <td>
                    <span className="pill warn">active</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Account, Case, ContactMethod, Contract, Customer, DebtRecord, Interaction, Service } from '@legacyops/domain';

interface Customer360 {
  customer: Customer;
  account: Account;
  contactMethods: ContactMethod[];
  contracts: Contract[];
  services: Service[];
  debts: DebtRecord[];
}

export function Customer360Page() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Customer360 | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [timeline, setTimeline] = useState<{ items: { kind: string; at: string; item: unknown }[] } | null>(null);
  const [billing, setBilling] = useState<{ invoices: unknown[]; payments: unknown[]; debts: unknown[]; totalDue: number; currency: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<Customer360>(`/customers/${id}`).then(setData);
    api.get<{ items: Case[] }>(`/customers/${id}/cases`).then((r) => setCases(r.items));
    api.get<{ items: { kind: string; at: string; item: unknown }[] }>(`/customers/${id}/timeline`).then(setTimeline);
    api.get<{ invoices: unknown[]; payments: unknown[]; debts: unknown[]; totalDue: number; currency: string }>(`/customers/${id}/billing`).then(setBilling);
  }, [id]);

  if (!data) return <div className="muted">Loading…</div>;
  const c = data.customer;

  return (
    <div>
      <h1 className="page-title">{c.displayName}</h1>
      <p className="page-subtitle">
        <span className="pill accent" style={{ marginRight: 8 }}>{c.segment}</span>
        {c.riskFlags.map((f) => <span key={f} className="pill warn" style={{ marginRight: 8 }}>{f}</span>)}
        <span className="muted">Customer ID: {c.id}</span>
        {c.externalId && <span className="muted" style={{ marginLeft: 12 }}>External ID (legacy): {c.externalId}</span>}
      </p>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Account</h3>
          <table>
            <tbody>
              <tr><th>Status</th><td><span className={`pill ${data.account.status === 'active' ? 'ok' : 'warn'}`}>{data.account.status}</span></td></tr>
              <tr><th>Currency</th><td>{data.account.currency}</td></tr>
              <tr><th>Opened</th><td className="muted">{data.account.openedAt.slice(0, 10)}</td></tr>
              <tr><th>External ID</th><td className="muted">{data.account.externalId ?? '—'}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Contact methods</h3>
          <ul className="list-clean">
            {data.contactMethods.map((cm) => (
              <li key={cm.id} className="row between">
                <span>{cm.type}: <strong>{cm.value}</strong></span>
                <span>
                  {cm.primary && <span className="pill accent" style={{ marginRight: 4 }}>primary</span>}
                  {cm.verified ? <span className="pill ok">verified</span> : <span className="pill warn">unverified</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Services & Contracts</h3>
          <table>
            <thead><tr><th>Service</th><th>Status</th><th>Since</th></tr></thead>
            <tbody>
              {data.services.map((s) => (
                <tr key={s.id}>
                  <td>{s.productId}</td>
                  <td><span className={`pill ${s.status === 'active' ? 'ok' : 'warn'}`}>{s.status}</span></td>
                  <td className="muted">{s.activatedAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Billing summary</h3>
          {billing ? (
            <>
              <div className="grid grid-2">
                <div className="kpi"><span className="label">Total due</span><span className="value">{billing.currency} {billing.totalDue}</span></div>
                <div className="kpi"><span className="label">Invoices</span><span className="value">{billing.invoices.length}</span></div>
                <div className="kpi"><span className="label">Payments</span><span className="value">{billing.payments.length}</span></div>
                <div className="kpi"><span className="label">Debts</span><span className="value">{billing.debts.length}</span></div>
              </div>
            </>
          ) : <span className="muted">Loading…</span>}
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Cases ({cases.length})</h3>
          <table>
            <thead><tr><th>Subject</th><th>Status</th><th>Priority</th><th>Category</th></tr></thead>
            <tbody>
              {cases.map((cs) => (
                <tr key={cs.id}>
                  <td>{cs.subject}</td>
                  <td><span className="pill">{cs.status}</span></td>
                  <td><span className={`pill ${cs.priority === 'urgent' ? 'danger' : cs.priority === 'high' ? 'warn' : ''}`}>{cs.priority}</span></td>
                  <td className="muted">{cs.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Interaction timeline</h3>
          {timeline ? (
            <ul className="list-clean">
              {timeline.items.slice(0, 12).map((it, i) => {
                const item = it.item as { subject?: string; reason?: string; summary?: string };
                return (
                  <li key={i} className="row between">
                    <span>
                      <span className="pill accent" style={{ marginRight: 8 }}>{it.kind}</span>
                      {item.subject ?? item.reason ?? item.summary ?? '—'}
                    </span>
                    <span className="muted">{it.at.slice(0, 16).replace('T', ' ')}</span>
                  </li>
                );
              })}
            </ul>
          ) : <span className="muted">Loading…</span>}
        </div>
      </div>
    </div>
  );
}

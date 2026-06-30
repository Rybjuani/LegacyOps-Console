import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Case } from '@legacyops/domain';
import { EmptyState, SectionHeader } from '../components/ui';

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    api.get<{ items: Case[] }>(`/cases?${params.toString()}`).then((r) => setCases(r.items));
  }, [status, category]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <SectionHeader
        title="Cases"
        subtitle="Native case management. Cases can be linked to legacy Service Requests through the bridge."
      />

      <div className="panel mb">
        <div className="row">
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="">All statuses</option>
            <option>open</option>
            <option>in_progress</option>
            <option>waiting_customer</option>
            <option>resolved</option>
            <option>closed</option>
            <option>cancelled</option>
          </select>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ maxWidth: 240 }}
          >
            <option value="">All categories</option>
            <option>billing_claim</option>
            <option>technical_complaint</option>
            <option>cancellation_retention</option>
            <option>payment_promise</option>
            <option>service_request</option>
            <option>general_inquiry</option>
            <option>complaint</option>
          </select>
          <button className="btn" onClick={load}>
            Apply
          </button>
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState message="No cases match the current filters." />
      ) : (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Case</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Category</th>
                <th>SLA due</th>
                <th>External ID</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td>{c.subject}</td>
                  <td className="muted">{c.customerId}</td>
                  <td>
                    <span className="pill">{c.status}</span>
                  </td>
                  <td>
                    <span
                      className={`pill ${c.priority === 'urgent' ? 'danger' : c.priority === 'high' ? 'warn' : ''}`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="muted">{c.category}</td>
                  <td className="muted">{c.slaDueAt?.slice(0, 16).replace('T', ' ') ?? '—'}</td>
                  <td className="muted">{c.externalId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

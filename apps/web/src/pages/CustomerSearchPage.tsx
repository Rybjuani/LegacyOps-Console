import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Customer } from '@legacyops/domain';
import { EmptyState, LoadingState, SectionHeader } from '../components/ui';

export function CustomerSearchPage() {
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState('');
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (segment) params.set('segment', segment);
    api
      .get<{ items: Customer[] }>(`/customers?${params.toString()}`)
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <SectionHeader
        title="Customer Search"
        subtitle="Search across residential, business and VIP customers."
        help="Use Search to load demo customers or filter by name, segment or risk."
      />

      <div className="panel mb">
        <div className="row">
          <input
            className="input"
            placeholder="Name, document, email or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select"
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            style={{ maxWidth: 180 }}
          >
            <option value="">All segments</option>
            <option value="residential">Residential</option>
            <option value="business">Business</option>
            <option value="vip">VIP</option>
          </select>
          <button className="btn" onClick={search} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Searching…" />
      ) : items.length === 0 ? (
        <EmptyState message="No customers found. Try adjusting your search." />
      ) : (
        <div className="panel">
          <h3>Results ({items.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Segment</th>
                <th>Document</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.displayName}</td>
                  <td>
                    <span className="pill accent">{c.segment}</span>
                  </td>
                  <td className="muted">{c.documentNumber ?? '—'}</td>
                  <td className="muted">{c.email ?? '—'}</td>
                  <td className="muted">{c.phone ?? '—'}</td>
                  <td>
                    {c.riskFlags.map((f) => (
                      <span key={f} className="pill warn" style={{ marginRight: 4 }}>
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </td>
                  <td>
                    <button className="btn secondary" onClick={() => navigate(`/customers/${c.id}`)}>
                      Open 360
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

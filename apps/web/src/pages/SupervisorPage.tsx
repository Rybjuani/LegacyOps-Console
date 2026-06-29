import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Case, Customer } from '@legacyops/domain';

export function SupervisorPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    api.get<{ items: Case[] }>('/cases').then((r) => setCases(r.items));
    api.get<{ items: Customer[] }>('/customers?pageSize=100').then((r) => setCustomers(r.items));
  }, []);

  const byStatus = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1; return acc;
  }, {});
  const byCategory = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1; return acc;
  }, {});
  const escalations = cases.filter((c) => c.priority === 'urgent' || c.priority === 'high').length;

  return (
    <div>
      <h1 className="page-title">Supervisor Dashboard</h1>
      <p className="page-subtitle">Team performance, SLA risk, escalations and audit visibility.</p>

      <div className="grid grid-4 mb">
        <div className="panel kpi"><span className="label">Open cases</span><span className="value">{cases.length}</span></div>
        <div className="panel kpi"><span className="label">Escalations</span><span className="value">{escalations}</span></div>
        <div className="panel kpi"><span className="label">Customers</span><span className="value">{customers.length}</span></div>
        <div className="panel kpi"><span className="label">Audit events</span><span className="value">live</span></div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <h3>By status</h3>
          <table>
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>
              {Object.entries(byStatus).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>By category</h3>
          <table>
            <thead><tr><th>Category</th><th>Count</th></tr></thead>
            <tbody>
              {Object.entries(byCategory).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Meta {
  businessObjects: { name: string; components: string[] }[];
  integrationObjects: { name: string; namespace: string; fields: string[] }[];
  businessServices: { name: string; displayName: string; methods: string[] }[];
}
interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export function SiebelBridgeLabPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invocation, setInvocation] = useState({ name: 'LegacyOps Customer BS', method: 'GetCustomer', args: '{}' });
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    api.get<Meta>('/siebel/mock/metadata').then(setMeta);
    api.get<{ items: Contact[] }>('/siebel/mock/customers').then((r) => setContacts(r.items.slice(0, 8)));
  }, []);

  function invoke() {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(invocation.args || '{}');
    } catch {
      setResult('Invalid JSON args');
      return;
    }
    api
      .post<{ ok: boolean; result: unknown; durationMs: number } | { ok: false; error: { message: string } }>(
        `/siebel/mock/business-service/${encodeURIComponent(invocation.name)}/invoke`,
        { method: invocation.method, args }
      )
      .then((r) => setResult(JSON.stringify(r, null, 2)))
      .catch((e) => setResult(String(e)));
  }

  return (
    <div>
      <h1 className="page-title">Siebel Bridge Lab</h1>
      <p className="page-subtitle">
        Synthetic Siebel-like backend — Business Objects, Integration Objects, Business Services, sessions and error
        simulation. All data is fictional. No proprietary schema is reproduced.
      </p>

      <div className="banner accent">
        Anti-corruption layer in action: the LegacyOps domain talks to the bridge through the adapter contracts defined
        in <code>@legacyops/siebel-bridge</code>. The mapping helpers translate DTOs into the LegacyOps domain without
        leaking Siebel concepts into the CRM core.
      </div>

      <div className="grid grid-3 mb">
        <div className="panel">
          <h3>Business Objects ({meta?.businessObjects.length ?? 0})</h3>
          <ul className="list-clean">
            {meta?.businessObjects.map((b) => (
              <li key={b.name}>
                <strong>{b.name}</strong>
                <br />
                <span className="muted">{b.components.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Integration Objects ({meta?.integrationObjects.length ?? 0})</h3>
          <ul className="list-clean">
            {meta?.integrationObjects.map((b) => (
              <li key={b.name}>
                <strong>{b.name}</strong>
                <br />
                <span className="muted">{b.namespace}</span>
                <br />
                <span className="muted">{b.fields.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Business Services ({meta?.businessServices.length ?? 0})</h3>
          <ul className="list-clean">
            {meta?.businessServices.map((b) => (
              <li key={b.name}>
                <strong>{b.displayName}</strong>
                <br />
                <span className="muted">{b.methods.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-2 mb">
        <div className="panel">
          <h3>Synthetic contacts (sample)</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="muted">{c.email ?? '—'}</td>
                  <td className="muted">{c.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>Business Service invoker</h3>
          <div className="col">
            <label className="muted">Business service</label>
            <input
              className="input"
              value={invocation.name}
              onChange={(e) => setInvocation({ ...invocation, name: e.target.value })}
            />
            <label className="muted">Method</label>
            <input
              className="input"
              value={invocation.method}
              onChange={(e) => setInvocation({ ...invocation, method: e.target.value })}
            />
            <label className="muted">Arguments (JSON)</label>
            <textarea
              className="textarea"
              rows={4}
              value={invocation.args}
              onChange={(e) => setInvocation({ ...invocation, args: e.target.value })}
            />
            <button className="btn" onClick={invoke}>
              Invoke
            </button>
            {result && <pre>{result}</pre>}
          </div>
        </div>
      </div>
    </div>
  );
}

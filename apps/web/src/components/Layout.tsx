import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  { group: 'Operations', items: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/customers', label: 'Customer Search' },
    { to: '/cases', label: 'Cases' },
    { to: '/workflows', label: 'Workflows' },
    { to: '/supervisor', label: 'Supervisor' }
  ]},
  { group: 'Legacy / Siebel', items: [
    { to: '/siebel-bridge', label: 'Siebel Bridge Lab' },
    { to: '/legacy-observability', label: 'Legacy Observability' },
    { to: '/migration', label: 'Migration Dry Run' },
    { to: '/source-of-truth', label: 'Source of Truth' }
  ]},
  { group: 'Business', items: [
    { to: '/roi', label: 'ROI Metrics' },
    { to: '/mode', label: 'Integration Mode' }
  ]}
];

export function Layout() {
  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand">LegacyOps Console</span>
        <span className="mode-badge">CRM core + Siebel-like bridge</span>
        <span style={{ flex: 1 }} />
        <span className="muted" style={{ fontSize: 12 }}>Synthetic mode · v0.1</span>
      </div>
      <aside className="sidebar">
        {nav.map((g) => (
          <div key={g.group}>
            <div className="group-title">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} className={({ isActive }) => isActive ? 'active' : ''}>
                {it.label}
              </NavLink>
            ))}
          </div>
        ))}
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, Outlet } from 'react-router-dom';

const nav = [
  {
    group: 'Daily Operations',
    items: [
      { to: '/dashboard', label: 'Home' },
      { to: '/interaction-console', label: 'Interaction Console' },
      { to: '/customers', label: 'Customer Search' },
      { to: '/cases', label: 'Cases' },
      { to: '/workflows', label: 'Workflows' }
    ]
  },
  {
    group: 'Supervision',
    items: [
      { to: '/supervisor', label: 'Supervisor' },
      { to: '/roi', label: 'ROI Metrics' }
    ]
  },
  {
    group: 'Technical / Legacy',
    items: [
      { to: '/siebel-bridge', label: 'Siebel Bridge Lab' },
      { to: '/legacy-observability', label: 'Legacy Observability' },
      { to: '/migration', label: 'Migration Dry Run' },
      { to: '/source-of-truth', label: 'Source of Truth' },
      { to: '/mode', label: 'Integration Mode' }
    ]
  }
];

export function Layout() {
  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand">LegacyOps Console</span>
        <span className="mode-badge">Synthetic demo</span>
        <span className="muted" style={{ fontSize: 12 }}>
          Operator-friendly CRM modernization lab
        </span>
        <span style={{ flex: 1 }} />
      </div>
      <aside className="sidebar">
        {nav.map((g) => (
          <div key={g.group}>
            <div className="group-title">{g.group}</div>
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'active' : '')}>
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

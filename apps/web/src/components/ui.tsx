/**
 * Common UI primitives for the LegacyOps web app.
 *
 * These are intentionally tiny and unstyled-beyond-the-global-CSS so they
 * compose into any page without extra setup. They exist so that loading,
 * error and empty states stay consistent across pages.
 */

import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="muted">{label}</div>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="banner warn" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="panel" style={{ textAlign: 'center', padding: '32px 16px' }}>
      <p className="muted" style={{ marginBottom: 12 }}>
        {message}
      </p>
      {action}
    </div>
  );
}

export function SectionHeader({ title, subtitle, help }: { title: string; subtitle?: string; help?: string }) {
  return (
    <div className="mb">
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {help && (
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {help}
        </p>
      )}
    </div>
  );
}

export type DataSourceBadgeKind = 'native' | 'legacy' | 'mapped' | 'synthetic';

const DS_LABELS: Record<DataSourceBadgeKind, string> = {
  native: 'Native',
  legacy: 'Legacy',
  mapped: 'Mapped',
  synthetic: 'Synthetic'
};

const DS_CLASSES: Record<DataSourceBadgeKind, string> = {
  native: 'pill ok',
  legacy: 'pill accent',
  mapped: 'pill accent',
  synthetic: 'pill'
};

export function DataSourceBadge({ kind, title }: { kind: DataSourceBadgeKind; title?: string }) {
  return (
    <span className={DS_CLASSES[kind]} title={title ?? `Data source: ${DS_LABELS[kind]}`}>
      {DS_LABELS[kind]}
    </span>
  );
}

export function TechnicalBanner({ children }: { children: ReactNode }) {
  return (
    <div className="banner accent" role="note">
      <strong>Technical / Legacy Integration.</strong> {children}
    </div>
  );
}

export function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div className="banner" style={{ borderColor: 'rgba(124, 227, 139, 0.4)', color: 'var(--good)' }} role="status">
      {children}
    </div>
  );
}

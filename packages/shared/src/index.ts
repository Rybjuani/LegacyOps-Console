/**
 * @legacyops/shared — Common types and utilities used across packages and apps.
 */

// ---------- API response envelope ----------
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function err(code: string, message: string, details?: Record<string, unknown>): ApiResult<never> {
  return { ok: false, error: { code, message, details } };
}

// ---------- Pagination ----------
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    pageSize: safeSize
  };
}

// ---------- ID helpers ----------
export type Branded<T, B> = T & { readonly __brand: B };

export type CustomerId = Branded<string, 'CustomerId'>;
export type AccountId = Branded<string, 'AccountId'>;
export type CaseId = Branded<string, 'CaseId'>;
export type InteractionId = Branded<string, 'InteractionId'>;
export type WorkflowRunId = Branded<string, 'WorkflowRunId'>;
export type AuditEventId = Branded<string, 'AuditEventId'>;
export type UserId = Branded<string, 'UserId'>;
export type InvoiceId = Branded<string, 'InvoiceId'>;
export type ExternalId = Branded<string, 'ExternalId'>;

export function id(prefix: string, suffix?: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return suffix ? `${prefix}_${time}_${rand}_${suffix}` : `${prefix}_${time}_${rand}`;
}

// ---------- Date helpers ----------
export function nowIso(): string {
  return new Date().toISOString();
}

export function formatIso(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

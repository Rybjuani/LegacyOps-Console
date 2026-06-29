/**
 * @legacyops/adapters — Generic adapter contracts.
 *
 * Adapters are the seam between the LegacyOps domain core and external systems
 * (real CRMs, billing systems, ticketing systems, identity providers,
 * observability backends, …). Implementations may target a real backend or
 * the synthetic Fake Siebel Lab in @legacyops/siebel-bridge.
 *
 * The LegacyOps domain never imports an adapter directly — it always goes
 * through the contracts declared here. This is the backbone of the
 * anti-corruption layer (see docs/ANTI_CORRUPTION_LAYER.md).
 */

import type {
  Account,
  Case,
  Customer,
  Interaction,
  Invoice,
  Payment
} from '@legacyops/domain';

// ---------- Common adapter primitives ----------
export interface AdapterHealth {
  adapter: string;
  status: 'up' | 'degraded' | 'down';
  latencyMs: number;
  lastCheckedAt: string;
  message?: string;
}

export interface AdapterCallContext {
  correlationId?: string;
  actorId?: string;
  timeoutMs?: number;
}

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'auth' | 'not_found' | 'permission' | 'unavailable' | 'conflict' | 'unknown',
    public readonly status: number = 502,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export interface SearchCustomersQuery {
  q?: string;
  documentNumber?: string;
  email?: string;
  phone?: string;
  segment?: Customer['segment'];
  limit?: number;
}

// ---------- CRM Adapter ----------
export interface CRMAdapter {
  name: string;
  getCustomerById(id: string, ctx?: AdapterCallContext): Promise<Customer>;
  searchCustomers(query: SearchCustomersQuery, ctx?: AdapterCallContext): Promise<Customer[]>;
  getAccountByCustomer(customerId: string, ctx?: AdapterCallContext): Promise<Account | undefined>;
  listCasesByCustomer(customerId: string, ctx?: AdapterCallContext): Promise<Case[]>;
  createCase(input: Partial<Case>, ctx?: AdapterCallContext): Promise<Case>;
  updateCase(id: string, changes: Partial<Case>, ctx?: AdapterCallContext): Promise<Case>;
  listInteractionsByCustomer(customerId: string, ctx?: AdapterCallContext): Promise<Interaction[]>;
}

// ---------- Billing Adapter ----------
export interface BillingAdapter {
  name: string;
  getBillingSummary(accountId: string, ctx?: AdapterCallContext): Promise<{
    accountId: string;
    totalDue: number;
    nextDueDate?: string;
    currency: string;
    overdueAmount: number;
  }>;
  listInvoices(accountId: string, ctx?: AdapterCallContext): Promise<Invoice[]>;
  listPayments(accountId: string, ctx?: AdapterCallContext): Promise<Payment[]>;
}

// ---------- Ticketing Adapter ----------
export interface TicketingAdapter {
  name: string;
  createExternalTicket(input: { subject: string; description: string; customerId: string }, ctx?: AdapterCallContext): Promise<{ externalId: string; url?: string }>;
  getExternalTicket(externalId: string, ctx?: AdapterCallContext): Promise<{ status: string; updatedAt: string }>;
}

// ---------- Auth Adapter ----------
export interface AuthAdapter {
  name: string;
  authenticate(credentials: { username: string; password: string }, ctx?: AdapterCallContext): Promise<{ userId: string; username: string; role: string; token: string }>;
  verifyToken(token: string, ctx?: AdapterCallContext): Promise<{ userId: string; role: string }>;
}

// ---------- Knowledge Base Adapter ----------
export interface KnowledgeBaseAdapter {
  name: string;
  searchArticles(query: string, ctx?: AdapterCallContext): Promise<{ id: string; title: string; snippet: string; url?: string }[]>;
  getArticle(id: string, ctx?: AdapterCallContext): Promise<{ id: string; title: string; body: string } | undefined>;
}

// ---------- Observability Adapter ----------
export interface ObservabilityAdapter {
  name: string;
  getHealthStatus(): Promise<AdapterHealth>;
  getMetrics(): Promise<Record<string, number>>;
}

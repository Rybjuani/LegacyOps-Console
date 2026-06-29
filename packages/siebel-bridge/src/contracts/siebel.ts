/**
 * Adapter contracts for the Siebel-like bridge.
 *
 * These mirror the conceptual Siebel-like object types but expose them
 * through the same adapter contracts used by the LegacyOps domain core
 * (see @legacyops/adapters). The anti-corruption layer translates between
 * these DTOs and the LegacyOps domain.
 */

import type {
  CRMAdapter,
  AdapterCallContext,
  AdapterHealth
} from '@legacyops/adapters';
import type {
  SiebelAccount,
  SiebelActivity,
  SiebelAsset,
  SiebelBusinessObject,
  SiebelBusinessService,
  SiebelContact,
  SiebelIntegrationObject,
  SiebelOrder,
  SiebelServiceRequest
} from './types.js';

export interface SiebelMetadataAdapter {
  listBusinessObjects(): Promise<SiebelBusinessObject[]>;
  listIntegrationObjects(): Promise<SiebelIntegrationObject[]>;
  listBusinessServices(): Promise<SiebelBusinessService[]>;
}

export interface SiebelCustomerAdapter {
  searchContacts(query: { q?: string; documentNumber?: string; email?: string; phone?: string }, ctx?: AdapterCallContext): Promise<SiebelContact[]>;
  getContact(id: string, ctx?: AdapterCallContext): Promise<SiebelContact | undefined>;
  getAccount(id: string, ctx?: AdapterCallContext): Promise<SiebelAccount | undefined>;
  listAssetsByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelAsset[]>;
  listOrdersByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelOrder[]>;
  listActivitiesByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelActivity[]>;
}

export interface SiebelAccountAdapter {
  listAccounts(query: { q?: string; status?: string }, ctx?: AdapterCallContext): Promise<SiebelAccount[]>;
  getAccount(id: string, ctx?: AdapterCallContext): Promise<SiebelAccount | undefined>;
}

export interface SiebelCaseAdapter {
  listServiceRequests(query: { accountId?: string; status?: string }, ctx?: AdapterCallContext): Promise<SiebelServiceRequest[]>;
  getServiceRequest(id: string, ctx?: AdapterCallContext): Promise<SiebelServiceRequest | undefined>;
  createServiceRequest(input: {
    accountId: string;
    contactId: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
  }, ctx?: AdapterCallContext): Promise<SiebelServiceRequest>;
}

export interface SiebelBillingAdapter {
  getBillingSummary(accountId: string, ctx?: AdapterCallContext): Promise<{
    accountId: string;
    totalDue: number;
    nextDueDate?: string;
    currency: string;
    overdueAmount: number;
  }>;
  listInvoices(accountId: string, ctx?: AdapterCallContext): Promise<
    { id: string; accountId: string; period: string; totalAmount: number; paidAmount: number; currency: string; status: string; issuedAt: string; dueAt: string }[]
  >;
  listInvoicesForAccount(accountId: string, ctx?: AdapterCallContext): Promise<
    { id: string; accountId: string; period: string; totalAmount: number; paidAmount: number; currency: string; status: string; issuedAt: string; dueAt: string }[]
  >;
}

export interface SiebelBusinessServiceInvoker {
  invoke(name: string, method: string, args: Record<string, unknown>, ctx?: AdapterCallContext): Promise<{ result: unknown; durationMs: number }>;
  listAvailable(): Promise<SiebelBusinessService[]>;
}

export interface SiebelAuthProvider {
  login(username: string, password: string): Promise<{ token: string; expiresAt: string; userId: string }>;
  verify(token: string): Promise<{ valid: boolean; expiresAt?: string; userId?: string }>;
  logout(token: string): Promise<void>;
}

export interface SiebelHealthProbe {
  health(): Promise<AdapterHealth>;
}

// Aggregate Siebel-like bridge contract
export interface SiebelBridge
  extends SiebelCustomerAdapter,
    SiebelAccountAdapter,
    SiebelCaseAdapter,
    SiebelBillingAdapter,
    SiebelBusinessServiceInvoker,
    SiebelMetadataAdapter,
    SiebelAuthProvider,
    SiebelHealthProbe,
    Partial<CRMAdapter> {
  name: 'siebel-bridge';
}

/**
 * RealSiebelAdapter — REST implementation of the `SiebelBridge` contract.
 *
 * This adapter talks to a real Siebel-like REST endpoint through the
 * `SiebelRestHttpClient`. It maps raw REST payloads to conceptual DTOs
 * via `RealSiebelPayloadMapper` so that raw Siebel responses NEVER escape
 * to the LegacyOps domain (anti-corruption layer).
 *
 * STATUS: foundation implemented and tested against mocked REST behaviour.
 * Validation against a real Siebel sandbox is still pending — see issue #4
 * and `docs/REAL_SIEBEL_ADAPTER.md`.
 *
 * The adapter does NOT replace the FakeSiebelAdapter. Both coexist; the
 * API selects which one to use via `LEGACYOPS_SIEBEL_ADAPTER` env var
 * (default: `fake`).
 */

import type { AdapterCallContext, AdapterHealth } from '@legacyops/adapters';
import type { ExternalId } from '@legacyops/shared';
import { nowIso } from '@legacyops/shared';
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
} from '../contracts/types.js';
import type { SiebelBridge } from '../contracts/siebel.js';
import type { RealSiebelConfig } from './RealSiebelConfig.js';
import { SiebelRestHttpClient, type FetchLike, type AdapterCallEvent } from './SiebelRestHttpClient.js';
import { SiebelRestSessionManager } from './SiebelRestSessionManager.js';
import { DEFAULT_ENDPOINT_MAP, fillPath, type RealSiebelEndpointMap } from './RealSiebelEndpointMap.js';
import {
  mapRestAccount,
  mapRestActivity,
  mapRestAsset,
  mapRestBusinessObject,
  mapRestBusinessService,
  mapRestContact,
  mapRestIntegrationObject,
  mapRestInvoice,
  mapRestOrder,
  mapRestServiceRequest,
  unwrapList
} from './RealSiebelPayloadMapper.js';

export interface RealSiebelAdapterHooks {
  onCall?: (event: AdapterCallEvent) => void;
  nowFn?: () => number;
  sleepFn?: (ms: number) => Promise<void>;
  randomFn?: () => number;
}

export interface RealSiebelAdapterOptions {
  config: RealSiebelConfig;
  fetchImpl: FetchLike;
  endpointMap?: Partial<RealSiebelEndpointMap>;
  hooks?: RealSiebelAdapterHooks;
}

export class RealSiebelAdapter implements SiebelBridge {
  readonly name = 'siebel-bridge' as const;
  private readonly client: SiebelRestHttpClient;
  private readonly session: SiebelRestSessionManager;
  private readonly endpoints: RealSiebelEndpointMap;
  private readonly config: RealSiebelConfig;

  constructor(opts: RealSiebelAdapterOptions) {
    this.config = opts.config;
    this.endpoints = { ...DEFAULT_ENDPOINT_MAP, ...opts.endpointMap };
    this.client = new SiebelRestHttpClient(opts.config, opts.fetchImpl, {
      onCall: opts.hooks?.onCall,
      nowFn: opts.hooks?.nowFn,
      sleepFn: opts.hooks?.sleepFn,
      randomFn: opts.hooks?.randomFn
    });
    this.session = new SiebelRestSessionManager(opts.config, opts.fetchImpl, opts.hooks?.nowFn);
  }

  getAdapterMode(): 'real' {
    return 'real';
  }

  getConfig(): Readonly<RealSiebelConfig> {
    return this.config;
  }

  getEndpointMap(): Readonly<RealSiebelEndpointMap> {
    return this.endpoints;
  }

  getCircuitState(): string {
    return this.client.getCircuitState();
  }

  // ---------- session / auth ----------
  // NOTE: the SiebelAuthProvider contract expects a username/password login
  // that returns a token. For basic/oauth modes we synthesise a stable
  // token from the static credentials. For session mode we delegate to the
  // session manager. These are conceptual implementations — real session
  // lifecycle depends on the customer's Siebel configuration.
  async login(username: string, password: string) {
    if (this.config.authMode === 'session') {
      const s = await this.session.login();
      return { token: s.token, expiresAt: new Date(s.expiresAt).toISOString(), userId: s.userId ?? username };
    }
    // basic / oauth — synthesize a non-sensitive handle.
    return {
      token: `static-${this.config.authMode}`,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      userId: username
    };
    void password;
  }

  async verify(token: string) {
    if (this.config.authMode === 'session') {
      const s = await this.session.getActiveSession();
      if (!s) return { valid: false };
      return {
        valid: s.token === token && s.expiresAt > Date.now(),
        expiresAt: new Date(s.expiresAt).toISOString(),
        userId: s.userId
      };
    }
    return { valid: token.startsWith('static-'), expiresAt: undefined, userId: undefined };
  }

  async logout(_token: string) {
    if (this.config.authMode === 'session') {
      await this.session.logout();
    }
  }

  // ---------- contacts ----------
  async searchContacts(
    query: { q?: string; documentNumber?: string; email?: string; phone?: string },
    _ctx?: AdapterCallContext
  ): Promise<SiebelContact[]> {
    const raw = await this.client.get<unknown>(this.endpoints.contactsSearch, {
      query: {
        searchspec: query.q,
        documentNumber: query.documentNumber,
        email: query.email,
        phone: query.phone,
        pageSize: this.config.defaultPageSize
      }
    });
    return unwrapList(raw).map((r) => mapRestContact(r));
  }

  async getContact(id: string, _ctx?: AdapterCallContext): Promise<SiebelContact | undefined> {
    try {
      const raw = await this.client.get<unknown>(fillPath(this.endpoints.contactById, { id }));
      return mapRestContact(raw);
    } catch (err) {
      if ((err as { mapped?: { category?: string } }).mapped?.category === 'not_found') return undefined;
      throw err;
    }
  }

  // ---------- accounts ----------
  async getAccount(id: string, _ctx?: AdapterCallContext): Promise<SiebelAccount | undefined> {
    try {
      const raw = await this.client.get<unknown>(fillPath(this.endpoints.accountById, { id }));
      return mapRestAccount(raw);
    } catch (err) {
      if ((err as { mapped?: { category?: string } }).mapped?.category === 'not_found') return undefined;
      throw err;
    }
  }

  async listAccounts(query: { q?: string; status?: string }, _ctx?: AdapterCallContext): Promise<SiebelAccount[]> {
    const raw = await this.client.get<unknown>(this.endpoints.accountsList, {
      query: {
        searchspec: query.q,
        status: query.status,
        pageSize: this.config.defaultPageSize
      }
    });
    return unwrapList(raw).map((r) => mapRestAccount(r));
  }

  // ---------- assets / orders / activities ----------
  async listAssetsByAccount(accountId: string, _ctx?: AdapterCallContext): Promise<SiebelAsset[]> {
    const raw = await this.client.get<unknown>(this.endpoints.assetsByAccount, {
      query: { accountId }
    });
    return unwrapList(raw).map((r) => mapRestAsset(r));
  }

  async listOrdersByAccount(accountId: string, _ctx?: AdapterCallContext): Promise<SiebelOrder[]> {
    const raw = await this.client.get<unknown>(this.endpoints.ordersByAccount, {
      query: { accountId }
    });
    return unwrapList(raw).map((r) => mapRestOrder(r));
  }

  async listActivitiesByAccount(accountId: string, _ctx?: AdapterCallContext): Promise<SiebelActivity[]> {
    const raw = await this.client.get<unknown>(this.endpoints.activitiesByAccount, {
      query: { accountId }
    });
    return unwrapList(raw).map((r) => mapRestActivity(r));
  }

  // ---------- service requests ----------
  async listServiceRequests(
    query: { accountId?: string; status?: string },
    _ctx?: AdapterCallContext
  ): Promise<SiebelServiceRequest[]> {
    const raw = await this.client.get<unknown>(this.endpoints.serviceRequests, {
      query: {
        accountId: query.accountId,
        status: query.status,
        pageSize: this.config.defaultPageSize
      }
    });
    return unwrapList(raw).map((r) => mapRestServiceRequest(r));
  }

  async getServiceRequest(id: string, _ctx?: AdapterCallContext): Promise<SiebelServiceRequest | undefined> {
    try {
      const raw = await this.client.get<unknown>(fillPath(this.endpoints.serviceRequestById, { id }));
      return mapRestServiceRequest(raw);
    } catch (err) {
      if ((err as { mapped?: { category?: string } }).mapped?.category === 'not_found') return undefined;
      throw err;
    }
  }

  async createServiceRequest(
    input: {
      accountId: string;
      contactId: string;
      subject: string;
      description: string;
      category: string;
      priority: string;
    },
    _ctx?: AdapterCallContext
  ): Promise<SiebelServiceRequest> {
    const raw = await this.client.post<unknown>(this.endpoints.createServiceRequest, {
      AccountId: input.accountId,
      ContactId: input.contactId,
      Subject: input.subject,
      Description: input.description,
      Category: input.category,
      Priority: input.priority,
      Status: 'Open'
    });
    return mapRestServiceRequest(raw);
  }

  // ---------- billing ----------
  async getBillingSummary(accountId: string, _ctx?: AdapterCallContext) {
    // Conceptual: derive summary from invoices list. A real Siebel may
    // expose a dedicated billing summary endpoint; override the path in
    // the endpoint map if so.
    const invoices = await this.listInvoices(accountId);
    const totalDue = invoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const overdue = invoices
      .filter((i) => i.status === 'Overdue')
      .reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0);
    const nextDue = invoices.find((i) => i.status === 'Issued' || i.status === 'Overdue');
    return {
      accountId,
      totalDue,
      nextDueDate: nextDue?.dueAt,
      currency: invoices[0]?.currency ?? 'USD',
      overdueAmount: overdue
    };
  }

  async listInvoices(accountId: string, _ctx?: AdapterCallContext) {
    const raw = await this.client.get<unknown>(this.endpoints.invoicesByAccount, {
      query: { accountId }
    });
    return unwrapList(raw).map((r) => mapRestInvoice(r));
  }

  listInvoicesForAccount(accountId: string, ctx?: AdapterCallContext) {
    return this.listInvoices(accountId, ctx);
  }

  // ---------- business services ----------
  async invoke(
    name: string,
    method: string,
    args: Record<string, unknown>,
    _ctx?: AdapterCallContext
  ): Promise<{ result: unknown; durationMs: number }> {
    const t0 = this.config ? Date.now() : 0;
    const path = fillPath(this.endpoints.businessServiceInvoke, { businessService: name, method });
    const result = await this.client.post<unknown>(path, args);
    return { result, durationMs: Date.now() - t0 };
  }

  async listAvailable(): Promise<SiebelBusinessService[]> {
    const raw = await this.client.get<unknown>(this.endpoints.metadataBusinessServices);
    return unwrapList(raw).map((r) => mapRestBusinessService(r));
  }

  // ---------- metadata ----------
  async listBusinessObjects(): Promise<SiebelBusinessObject[]> {
    const raw = await this.client.get<unknown>(this.endpoints.metadataBusinessObjects);
    return unwrapList(raw).map((r) => mapRestBusinessObject(r));
  }

  async listIntegrationObjects(): Promise<SiebelIntegrationObject[]> {
    const raw = await this.client.get<unknown>(this.endpoints.metadataIntegrationObjects);
    return unwrapList(raw).map((r) => mapRestIntegrationObject(r));
  }

  async listBusinessServices(): Promise<SiebelBusinessService[]> {
    return this.listAvailable();
  }

  // ---------- health ----------
  async health(): Promise<AdapterHealth> {
    const t0 = Date.now();
    if (this.client.isCircuitOpen()) {
      return {
        adapter: 'siebel-bridge',
        status: 'down',
        latencyMs: Date.now() - t0,
        lastCheckedAt: nowIso(),
        message: 'Circuit breaker open'
      };
    }
    try {
      await this.client.get(this.endpoints.healthCheck, { timeoutMs: Math.min(this.config.timeoutMs, 2000) });
      return {
        adapter: 'siebel-bridge',
        status: 'up',
        latencyMs: Date.now() - t0,
        lastCheckedAt: nowIso(),
        message: 'RealSiebelAdapter health check ok'
      };
    } catch (err) {
      return {
        adapter: 'siebel-bridge',
        status: 'degraded',
        latencyMs: Date.now() - t0,
        lastCheckedAt: nowIso(),
        message: (err as Error).message
      };
    }
  }

  async getMetrics(): Promise<Record<string, number>> {
    return {
      circuit_state: this.client.getCircuitState() === 'closed' ? 0 : 1,
      default_page_size: this.config.defaultPageSize,
      max_retries: this.config.maxRetries,
      timeout_ms: this.config.timeoutMs
    };
  }
}

// Helper to build a RealSiebelAdapter from env + a fetch implementation.
export function buildRealSiebelAdapter(
  config: RealSiebelConfig,
  fetchImpl: FetchLike,
  endpointMap?: Partial<RealSiebelEndpointMap>,
  hooks?: RealSiebelAdapterHooks
): RealSiebelAdapter {
  return new RealSiebelAdapter({ config, fetchImpl, endpointMap, hooks });
}

// Re-export for external consumers.
export type { ExternalId };

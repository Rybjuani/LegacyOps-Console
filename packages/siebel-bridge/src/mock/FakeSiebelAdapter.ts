/**
 * FakeSiebelAdapter — the heart of the Fake Siebel Lab.
 *
 * Implements the full SiebelBridge contract against an in-memory synthetic
 * dataset. This is what the API and the UI talk to when running in
 * `legacy_overlay` or `progressive_migration` mode. Real backends would
 * implement the same contract over REST/SOAP/EAI.
 */

import type { AdapterCallContext, AdapterHealth } from '@legacyops/adapters';
import { AdapterError } from '@legacyops/adapters';
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
import { FakeSiebelErrorSimulator } from './FakeSiebelErrorSimulator.js';
import { FakeSiebelMetadataProvider } from './FakeSiebelMetadataProvider.js';
import { FakeSiebelSessionStore } from './FakeSiebelSession.js';

export interface FakeSiebelDataset {
  accounts: SiebelAccount[];
  contacts: SiebelContact[];
  serviceRequests: SiebelServiceRequest[];
  assets: SiebelAsset[];
  activities: SiebelActivity[];
  orders: SiebelOrder[];
  invoices: {
    id: string;
    accountId: string;
    period: string;
    totalAmount: number;
    paidAmount: number;
    currency: string;
    status: string;
    issuedAt: string;
    dueAt: string;
  }[];
}

export class FakeSiebelAdapter implements SiebelBridge {
  readonly name = 'siebel-bridge' as const;
  private readonly sessions = new FakeSiebelSessionStore();
  private readonly errors = new FakeSiebelErrorSimulator();
  private readonly meta = new FakeSiebelMetadataProvider();

  constructor(private data: FakeSiebelDataset) {}

  // ----- session / auth -----
  async login(username: string, password: string) {
    const s = this.sessions.login(username, password);
    if (!s) throw new AdapterError('Invalid credentials', 'auth', 401);
    return { token: s.token, expiresAt: s.expiresAt, userId: s.userId };
  }

  verify(token: string) {
    return Promise.resolve(this.sessions.verify(token));
  }

  logout(token: string) {
    this.sessions.logout(token);
    return Promise.resolve();
  }

  // ----- customer / contact -----
  async searchContacts(
    query: { q?: string; documentNumber?: string; email?: string; phone?: string },
    ctx?: AdapterCallContext
  ): Promise<SiebelContact[]> {
    await this.simulate(ctx);
    const q = (query.q ?? '').toLowerCase();
    return this.data.contacts.filter((c) => {
      if (query.documentNumber && c.documentNumber !== query.documentNumber) return false;
      if (query.email && c.email !== query.email) return false;
      if (query.phone && c.phone !== query.phone) return false;
      if (q) {
        const hay = `${c.firstName} ${c.lastName} ${c.email ?? ''} ${c.documentNumber ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async getContact(id: string, ctx?: AdapterCallContext): Promise<SiebelContact | undefined> {
    await this.simulate(ctx);
    return this.data.contacts.find((c) => c.id === id);
  }

  async getAccount(id: string, ctx?: AdapterCallContext): Promise<SiebelAccount | undefined> {
    await this.simulate(ctx);
    return this.data.accounts.find((a) => a.id === id);
  }

  async listAssetsByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelAsset[]> {
    await this.simulate(ctx);
    return this.data.assets.filter((a) => a.accountId === accountId);
  }

  async listOrdersByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelOrder[]> {
    await this.simulate(ctx);
    return this.data.orders.filter((o) => o.accountId === accountId);
  }

  async listActivitiesByAccount(accountId: string, ctx?: AdapterCallContext): Promise<SiebelActivity[]> {
    await this.simulate(ctx);
    return this.data.activities.filter((a) => a.accountId === accountId);
  }

  // ----- account -----
  async listAccounts(query: { q?: string; status?: string }, ctx?: AdapterCallContext): Promise<SiebelAccount[]> {
    await this.simulate(ctx);
    return this.data.accounts.filter((a) => {
      if (query.status && a.status !== query.status) return false;
      if (query.q && !a.name.toLowerCase().includes(query.q.toLowerCase())) return false;
      return true;
    });
  }

  // ----- service requests -----
  async listServiceRequests(
    query: { accountId?: string; status?: string },
    ctx?: AdapterCallContext
  ): Promise<SiebelServiceRequest[]> {
    await this.simulate(ctx);
    return this.data.serviceRequests.filter((s) => {
      if (query.accountId && s.accountId !== query.accountId) return false;
      if (query.status && s.status !== query.status) return false;
      return true;
    });
  }

  async getServiceRequest(id: string, ctx?: AdapterCallContext): Promise<SiebelServiceRequest | undefined> {
    await this.simulate(ctx);
    return this.data.serviceRequests.find((s) => s.id === id);
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
    ctx?: AdapterCallContext
  ): Promise<SiebelServiceRequest> {
    await this.simulate(ctx);
    const sr: SiebelServiceRequest = {
      id: `ext_sr_${Math.random().toString(36).slice(2, 10)}` as ExternalId,
      accountId: input.accountId as ExternalId,
      contactId: input.contactId as ExternalId,
      status: 'Open',
      priority: input.priority as SiebelServiceRequest['priority'],
      category: input.category,
      subject: input.subject,
      description: input.description,
      created: nowIso(),
      updated: nowIso(),
      srNumber: `1-${Math.floor(1000000 + Math.random() * 8999999)}`
    };
    this.data.serviceRequests.push(sr);
    return sr;
  }

  // ----- billing -----
  async getBillingSummary(accountId: string, ctx?: AdapterCallContext) {
    await this.simulate(ctx);
    const invoices = this.data.invoices.filter((i) => i.accountId === accountId);
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

  async listInvoices(accountId: string, ctx?: AdapterCallContext) {
    await this.simulate(ctx);
    return this.data.invoices
      .filter((i) => i.accountId === accountId)
      .map((i) => ({
        id: i.id,
        accountId: i.accountId,
        period: i.period,
        totalAmount: i.totalAmount,
        paidAmount: i.paidAmount,
        currency: i.currency,
        status: i.status,
        issuedAt: i.issuedAt,
        dueAt: i.dueAt
      }));
  }

  listInvoicesForAccount(accountId: string, ctx?: AdapterCallContext) {
    return this.listInvoices(accountId, ctx);
  }

  // ----- business services -----
  async invoke(
    name: string,
    method: string,
    args: Record<string, unknown>,
    ctx?: AdapterCallContext
  ): Promise<{ result: unknown; durationMs: number }> {
    const t0 = Date.now();
    await this.simulate(ctx);
    const bs = this.meta.findBusinessService(name);
    if (!bs) throw new AdapterError(`Business service "${name}" not found`, 'not_found', 404);
    if (!bs.methods.includes(method))
      throw new AdapterError(`Method "${method}" not found on BS "${name}"`, 'not_found', 404);
    const result = {
      ok: true,
      echo: args,
      bs: name,
      method,
      timestamp: nowIso()
    };
    return { result, durationMs: Date.now() - t0 };
  }

  listAvailable(): Promise<SiebelBusinessService[]> {
    return Promise.resolve(this.meta.listBusinessServices());
  }

  // ----- metadata -----
  listBusinessObjects(): Promise<SiebelBusinessObject[]> {
    return Promise.resolve(this.meta.listBusinessObjects());
  }

  listIntegrationObjects(): Promise<SiebelIntegrationObject[]> {
    return Promise.resolve(this.meta.listIntegrationObjects());
  }

  listBusinessServices(): Promise<SiebelBusinessService[]> {
    return Promise.resolve(this.meta.listBusinessServices());
  }

  // ----- health -----
  async health(): Promise<AdapterHealth> {
    return {
      adapter: 'siebel-bridge',
      status: 'up',
      latencyMs: this.errors.latency(),
      lastCheckedAt: nowIso(),
      message: 'Fake Siebel Lab — synthetic backend'
    };
  }

  getMetrics(): Promise<Record<string, number>> {
    return Promise.resolve({
      active_sessions: this.sessions.active(),
      service_requests: this.data.serviceRequests.length,
      contacts: this.data.contacts.length,
      accounts: this.data.accounts.length
    });
  }

  // ----- internals -----
  private async simulate(ctx?: AdapterCallContext): Promise<void> {
    const ms = this.errors.latency();
    await new Promise((r) => setTimeout(r, ms));
    this.errors.maybeThrow(ctx);
  }

  configureErrors(cfg: Parameters<FakeSiebelErrorSimulator['configure']>[0]): void {
    this.errors.configure(cfg);
  }

  /**
   * Force the next adapter call to throw the specified deterministic error.
   * The forced error is consumed after one call. Used by tests to exercise
   * each error code without flakiness.
   */
  setNextError(err: Parameters<FakeSiebelErrorSimulator['setNextError']>[0]): void {
    this.errors.setNextError(err);
  }

  /**
   * Force the next `isPartialData` check to return the specified value.
   * The forced value is consumed after one call. Used by tests.
   */
  setNextPartialData(value: boolean | null): void {
    this.errors.setNextPartialData(value);
  }

  /**
   * Direct access to the partial-data check. Exposed for tests; not used
   * by the adapter's read paths in the current scaffold.
   */
  isPartialDataNow(): boolean {
    return this.errors.isPartialData();
  }

  forceSessionExpiry(token: string): void {
    this.sessions.forceExpire(token);
  }

  getDataset(): Readonly<FakeSiebelDataset> {
    return this.data;
  }

  setDataset(dataset: FakeSiebelDataset): void {
    this.data = dataset;
  }
}

import { describe, it, expect } from 'vitest';
import { FakeSiebelAdapter } from '@legacyops/siebel-bridge';
import type { FakeSiebelDataset } from '@legacyops/siebel-bridge';

function makeAdapter(): FakeSiebelAdapter {
  const ds: FakeSiebelDataset = {
    accounts: [
      { id: 'ext_acc_1', name: 'Acme', bu: 'BU_N', status: 'Active', currency: 'USD', segment: 'business' },
      { id: 'ext_acc_2', name: 'Globex', bu: 'BU_S', status: 'Active', currency: 'USD', segment: 'residential' }
    ],
    contacts: [
      { id: 'ext_cust_1', accountId: 'ext_acc_1', firstName: 'Ana', lastName: 'Paz', email: 'a@b.com', phone: '1', documentNumber: '1001' },
      { id: 'ext_cust_2', accountId: 'ext_acc_2', firstName: 'Ben', lastName: 'Rae', email: 'b@c.com', phone: '2', documentNumber: '1002' }
    ],
    serviceRequests: [
      {
        id: 'ext_sr_1', accountId: 'ext_acc_1', contactId: 'ext_cust_1',
        status: 'Open', priority: '1-High', category: 'Billing Dispute',
        subject: 'Bad invoice', description: 'desc', owner: 'usr_op1',
        created: '2026-01-01T00:00:00.000Z', updated: '2026-01-02T00:00:00.000Z', srNumber: '1-12345'
      }
    ],
    assets: [
      { id: 'ext_asset_1', accountId: 'ext_acc_1', productName: 'Fiber 500', status: 'Active', startDate: '2025-01-01' }
    ],
    activities: [
      { id: 'ext_act_1', accountId: 'ext_acc_1', type: 'Call', status: 'Done', description: 'Call about invoice', planned: '2026-01-01', actual: '2026-01-01', owner: 'usr_op1' }
    ],
    orders: [
      { id: 'ext_ord_1', accountId: 'ext_acc_1', orderNumber: 'ORD-1', type: 'New', status: 'Completed', total: 100, currency: 'USD', created: '2025-12-01' }
    ],
    invoices: [
      { id: 'ext_inv_1', accountId: 'ext_acc_1', period: '2026-01', totalAmount: 100, paidAmount: 100, currency: 'USD', status: 'Paid', issuedAt: '2026-01-01', dueAt: '2026-01-15' }
    ]
  };
  return new FakeSiebelAdapter(ds);
}

describe('fake siebel adapter', () => {
  it('searches contacts', async () => {
    const a = makeAdapter();
    const items = await a.searchContacts({ q: 'a' });
    expect(items.length).toBeGreaterThan(0);
  });

  it('reads a contact by id', async () => {
    const a = makeAdapter();
    const found = await a.getContact('ext_cust_1');
    expect(found).toBeDefined();
    expect(found!.id).toBe('ext_cust_1');
  });

  it('lists service requests with srNumber format', async () => {
    const a = makeAdapter();
    const items = await a.listServiceRequests({});
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].srNumber).toMatch(/^1-\d+$/);
  });

  it('returns metadata', async () => {
    const a = makeAdapter();
    const bos = await a.listBusinessObjects();
    const ios = await a.listIntegrationObjects();
    const bss = await a.listBusinessServices();
    expect(bos.length).toBeGreaterThan(0);
    expect(ios.length).toBeGreaterThan(0);
    expect(bss.length).toBeGreaterThan(0);
  });

  it('invokes a known business service', async () => {
    const a = makeAdapter();
    const r = await a.invoke('LegacyOps Customer BS', 'GetCustomer', { id: 'x' });
    expect(r.result).toBeDefined();
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects unknown business service', async () => {
    const a = makeAdapter();
    await expect(a.invoke('Unknown BS', 'foo', {})).rejects.toThrow();
  });

  it('creates a service request', async () => {
    const a = makeAdapter();
    a.configureErrors({ timeoutRate: 0, authFailureRate: 0, permissionDeniedRate: 0, conflictRate: 0, partialDataRate: 0, fixedLatencyMs: 0, jitterMs: 0 });
    const before = (await a.listServiceRequests({})).length;
    const sr = await a.createServiceRequest({
      accountId: 'ext_acc_1',
      contactId: 'ext_cust_1',
      subject: 'Test SR',
      description: 'Created by test',
      category: 'billing_claim',
      priority: '2-Medium'
    });
    expect(sr.id).toBeTruthy();
    const after = (await a.listServiceRequests({})).length;
    expect(after).toBe(before + 1);
  });

  it('authenticates and verifies sessions', async () => {
    const a = makeAdapter();
    const s = await a.login('demo', 'demo');
    expect(s.token).toBeTruthy();
    const v = await a.verify(s.token);
    expect(v.valid).toBe(true);
    await a.logout(s.token);
    const v2 = await a.verify(s.token);
    expect(v2.valid).toBe(false);
  });

  it('returns adapter health', async () => {
    const a = makeAdapter();
    const h = await a.health();
    expect(h.adapter).toBe('siebel-bridge');
    expect(h.status).toBe('up');
  });

  it('returns adapter metrics', async () => {
    const a = makeAdapter();
    const m = await a.getMetrics();
    expect(m.accounts).toBeGreaterThan(0);
    expect(m.contacts).toBeGreaterThan(0);
  });
});

/**
 * Deterministic error coverage for FakeSiebelAdapter.
 *
 * Each test forces a specific failure mode via setNextError / setNextPartialData /
 * forceSessionExpiry, so the result does not depend on Math.random().
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FakeSiebelAdapter } from './FakeSiebelAdapter.js';
import type { FakeSiebelDataset } from './FakeSiebelAdapter.js';

function makeDataset(): FakeSiebelDataset {
  return {
    accounts: [
      { id: 'ext_acc_1', name: 'Acme', bu: 'BU_N', status: 'Active', currency: 'USD', segment: 'business' },
      { id: 'ext_acc_2', name: 'Globex', bu: 'BU_S', status: 'Active', currency: 'USD', segment: 'residential' }
    ],
    contacts: [
      {
        id: 'ext_cust_1',
        accountId: 'ext_acc_1',
        firstName: 'Ana',
        lastName: 'Paz',
        email: 'a@b.com',
        phone: '1',
        documentNumber: '1001'
      }
    ],
    serviceRequests: [
      {
        id: 'ext_sr_1',
        accountId: 'ext_acc_1',
        contactId: 'ext_cust_1',
        status: 'Open',
        priority: '1-High',
        category: 'Billing Dispute',
        subject: 'Bad invoice',
        description: 'desc',
        owner: 'usr_op1',
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-02T00:00:00.000Z',
        srNumber: '1-12345'
      }
    ],
    assets: [
      { id: 'ext_asset_1', accountId: 'ext_acc_1', productName: 'Fiber 500', status: 'Active', startDate: '2025-01-01' }
    ],
    activities: [
      {
        id: 'ext_act_1',
        accountId: 'ext_acc_1',
        type: 'Call',
        status: 'Done',
        description: 'Call about invoice',
        planned: '2026-01-01',
        actual: '2026-01-01',
        owner: 'usr_op1'
      }
    ],
    orders: [
      {
        id: 'ext_ord_1',
        accountId: 'ext_acc_1',
        orderNumber: 'ORD-1',
        type: 'New',
        status: 'Completed',
        total: 100,
        currency: 'USD',
        created: '2025-12-01'
      }
    ],
    invoices: [
      {
        id: 'ext_inv_1',
        accountId: 'ext_acc_1',
        period: '2026-01',
        totalAmount: 100,
        paidAmount: 100,
        currency: 'USD',
        status: 'Paid',
        issuedAt: '2026-01-01',
        dueAt: '2026-01-15'
      }
    ]
  };
}

describe('FakeSiebelAdapter — deterministic error coverage', () => {
  let adapter: FakeSiebelAdapter;

  beforeEach(() => {
    adapter = new FakeSiebelAdapter(makeDataset());
    adapter.configureErrors({
      timeoutRate: 0,
      authFailureRate: 0,
      permissionDeniedRate: 0,
      conflictRate: 0,
      partialDataRate: 0,
      fixedLatencyMs: 0,
      jitterMs: 0
    });
  });

  it('throws a forced timeout on searchContacts', async () => {
    adapter.setNextError('timeout');
    await expect(adapter.searchContacts({})).rejects.toThrowError(/Integration layer timeout/);
  });

  it('throws a forced auth_expired on getContact', async () => {
    adapter.setNextError('auth_expired');
    await expect(adapter.getContact('ext_cust_1')).rejects.toThrowError(/Session expired/);
  });

  it('throws a forced permission_denied on getAccount', async () => {
    adapter.setNextError('permission_denied');
    await expect(adapter.getAccount('ext_acc_1')).rejects.toThrowError(/Permission denied/);
  });

  it('throws a forced conflict on listAssetsByAccount', async () => {
    adapter.setNextError('conflict');
    await expect(adapter.listAssetsByAccount('ext_acc_1')).rejects.toThrowError(/Data conflict/);
  });

  it('throws a forced generic error on listServiceRequests', async () => {
    adapter.setNextError('generic');
    await expect(adapter.listServiceRequests({})).rejects.toThrowError(/Generic Siebel-like error/);
  });

  it('clears the forced error after one call (next call succeeds)', async () => {
    adapter.setNextError('timeout');
    await expect(adapter.searchContacts({})).rejects.toThrow();
    // Second call should succeed
    const items = await adapter.searchContacts({});
    expect(items.length).toBeGreaterThan(0);
  });

  it('rejects unknown business service with not_found', async () => {
    await expect(adapter.invoke('Nonexistent BS', 'foo', {})).rejects.toThrowError(/not found/);
  });

  it('rejects unknown business service method with not_found', async () => {
    await expect(adapter.invoke('LegacyOps Customer BS', 'NonexistentMethod', {})).rejects.toThrowError(/not found/);
  });

  it('session expires deterministically when forceExpire is called', async () => {
    const session = await adapter.login('demo', 'demo');
    expect(session.token).toBeTruthy();
    expect((await adapter.verify(session.token)).valid).toBe(true);
    adapter.forceSessionExpiry(session.token);
    expect((await adapter.verify(session.token)).valid).toBe(false);
  });

  it('login fails with auth error on empty credentials', async () => {
    await expect(adapter.login('', '')).rejects.toThrowError(/Invalid credentials/);
  });

  it('health always returns up for the fake lab', async () => {
    const h = await adapter.health();
    expect(h.status).toBe('up');
    expect(h.adapter).toBe('siebel-bridge');
  });

  it('isPartialData returns the forced value then falls back to stochastic', () => {
    adapter.setNextPartialData(true);
    expect(adapter.isPartialDataNow()).toBe(true);
    expect(adapter.isPartialDataNow()).toBe(false); // rate is 0 in beforeEach
  });

  it('createServiceRequest appends to the dataset', async () => {
    const before = (await adapter.listServiceRequests({})).length;
    const sr = await adapter.createServiceRequest({
      accountId: 'ext_acc_1',
      contactId: 'ext_cust_1',
      subject: 'Test',
      description: 'desc',
      category: 'billing_claim',
      priority: '2-Medium'
    });
    expect(sr.id).toBeTruthy();
    const after = (await adapter.listServiceRequests({})).length;
    expect(after).toBe(before + 1);
  });
});

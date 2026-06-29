import { describe, it, expect } from 'vitest';
import { mapSiebelAccountToLegacyOps, mapSiebelCategoryToLegacyOps, mapSiebelContactToCustomer, mapSiebelSRToCase } from '@legacyops/siebel-bridge';

describe('siebel → legacyops object mapping', () => {
  it('maps an account', () => {
    const out = mapSiebelAccountToLegacyOps({ id: 'ext_1', name: 'Acme', bu: 'BU_N', status: 'Active', currency: 'USD' });
    expect(out.status).toBe('active');
    expect(out.currency).toBe('USD');
  });

  it('maps a contact to a customer', () => {
    const out = mapSiebelContactToCustomer(
      { id: 'ext_c1', accountId: 'ext_a1', firstName: 'Ana', lastName: 'Paz', email: 'a@b.com' },
      { id: 'ext_a1', name: 'Acme', bu: 'BU_N', status: 'Active', currency: 'USD' }
    );
    expect(out.displayName).toBe('Ana Paz');
    expect(out.email).toBe('a@b.com');
    expect(out.externalId).toBe('ext_c1');
    expect(out.externalAccountId).toBe('ext_a1');
  });

  it('maps a service request to a case', () => {
    const sr = {
      id: 'ext_sr1', accountId: 'ext_a1', contactId: 'ext_c1',
      status: 'Open' as const, priority: '1-High' as const,
      category: 'Billing Dispute', subject: 'Bad invoice', description: 'desc',
      owner: 'usr_op1', created: '2026-01-01T00:00:00.000Z', updated: '2026-01-02T00:00:00.000Z',
      srNumber: '1-12345'
    };
    const c = mapSiebelSRToCase(sr, 'cust_1');
    expect(c.subject).toBe('Bad invoice');
    expect(c.priority).toBe('urgent');
    expect(c.category).toBe('billing_claim');
    expect(c.externalId).toBe('ext_sr1');
  });

  it('maps categories sensibly', () => {
    expect(mapSiebelCategoryToLegacyOps('Billing Dispute')).toBe('billing_claim');
    expect(mapSiebelCategoryToLegacyOps('Cancel Service')).toBe('cancellation_retention');
    expect(mapSiebelCategoryToLegacyOps('Technical Outage')).toBe('technical_complaint');
    expect(mapSiebelCategoryToLegacyOps('Random Unknown')).toBe('general_inquiry');
  });
});

import { describe, it, expect } from 'vitest';
import { canTransitionCase, customerDisplayName, hasRiskFlag, isHighRisk, slaStatus } from '@legacyops/domain';
import type { Customer } from '@legacyops/domain';

describe('domain sanity', () => {
  it('allows valid case transitions', () => {
    expect(canTransitionCase('open', 'in_progress')).toBe(true);
    expect(canTransitionCase('closed', 'open')).toBe(false);
    expect(canTransitionCase('in_progress', 'resolved')).toBe(true);
  });

  it('formats customer display name with VIP marker', () => {
    const c: Pick<Customer, 'displayName' | 'legalName' | 'segment'> = {
      displayName: 'John Doe',
      segment: 'vip'
    };
    expect(customerDisplayName(c)).toBe('John Doe ★');
  });

  it('detects high-risk customers', () => {
    expect(hasRiskFlag({ riskFlags: ['churn_risk'] }, 'churn_risk')).toBe(true);
    expect(isHighRisk({ riskFlags: ['vip'] })).toBe(false);
    expect(isHighRisk({ riskFlags: ['high_debt'] })).toBe(true);
  });

  it('reports SLA status correctly', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
    const past = new Date(Date.now() - 1000).toISOString();
    const created = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString();

    expect(slaStatus({ slaDueAt: future, createdAt: created, status: 'in_progress' }).status).toBe('on_track');
    expect(slaStatus({ slaDueAt: past, createdAt: created, status: 'in_progress' }).status).toBe('breached');
    expect(slaStatus({ slaDueAt: future, createdAt: created, status: 'closed' }).status).toBe('no_sla');
  });
});

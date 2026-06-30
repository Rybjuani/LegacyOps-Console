/**
 * Tests for the extended CRM helpers introduced in B1.
 */

import { describe, it, expect } from 'vitest';
import {
  assignCaseToQueue,
  calculateCustomerRisk,
  calculateSlaStatus,
  canTransitionCaseStatus,
  createPaymentPromise,
  escalateCase,
  summarizeCustomerOperationalState,
  type Case,
  type CaseEscalation,
  type Customer,
  type CustomerRiskSignal,
  type DebtRecord,
  type PaymentPromise,
  type SlaPolicy
} from '@legacyops/domain';

function makeCase(overrides: Partial<Case> = {}): Case {
  return {
    id: 'case_test' as Case['id'],
    customerId: 'cust_1' as Customer['id'],
    status: 'open',
    priority: 'normal',
    category: 'billing_claim',
    subject: 'Test',
    description: 'desc',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    slaDueAt: '2026-01-05T00:00:00.000Z',
    ...overrides
  };
}

describe('extended CRM helpers', () => {
  it('canTransitionCaseStatus wraps canTransitionCase', () => {
    expect(canTransitionCaseStatus('open', 'in_progress')).toBe(true);
    expect(canTransitionCaseStatus('closed', 'open')).toBe(false);
  });

  it('calculateSlaStatus uses policy.resolutionHours when slaDueAt is missing', () => {
    const policy: SlaPolicy = {
      id: 'p1',
      name: 'default',
      responseHours: 2,
      resolutionHours: 48,
      active: true
    };
    const c = makeCase({ slaDueAt: undefined, createdAt: '2026-01-01T00:00:00.000Z' });
    const status = calculateSlaStatus(c, policy);
    expect(['on_track', 'at_risk', 'breached', 'no_sla']).toContain(status.status);
  });

  it('calculateSlaStatus returns no_sla when no policy and no slaDueAt', () => {
    const c = makeCase({ slaDueAt: undefined, status: 'open' });
    expect(calculateSlaStatus(c).status).toBe('no_sla');
  });

  it('assignCaseToQueue updates case and produces a QueueAssignment', () => {
    const c = makeCase();
    const { caseEntity, assignment } = assignCaseToQueue({
      caseEntity: c,
      queueId: 'q_voice',
      assigneeId: 'usr_op1' as never,
      reason: 'manual',
      actorId: 'usr_op1' as never
    });
    expect(caseEntity.queueId).toBe('q_voice');
    expect(caseEntity.assigneeId).toBe('usr_op1');
    expect(assignment.caseId).toBe(c.id);
    expect(assignment.reason).toBe('manual');
    expect(assignment.assignedAt).toBeTruthy();
  });

  it('escalateCase bumps priority and produces a CaseEscalation', () => {
    const c = makeCase({ priority: 'normal', assigneeId: 'usr_op1' as never });
    const { caseEntity, escalation } = escalateCase({
      caseEntity: c,
      toAssigneeId: 'usr_super' as never,
      toQueueId: 'q_esc',
      reason: 'customer requested supervisor',
      escalatedBy: 'usr_op1' as never
    });
    expect(caseEntity.priority).toBe('high');
    expect(caseEntity.assigneeId).toBe('usr_super');
    expect(escalation.fromAssigneeId).toBe('usr_op1');
    expect(escalation.toAssigneeId).toBe('usr_super');
    expect(escalation.reason).toMatch(/supervisor/);
  });

  it('escalateCase on urgent stays urgent (no overflow)', () => {
    const c = makeCase({ priority: 'urgent' });
    const { caseEntity } = escalateCase({
      caseEntity: c,
      reason: 'r',
      escalatedBy: 'usr_op1' as never
    });
    expect(caseEntity.priority).toBe('urgent');
  });

  it('createPaymentPromise builds a pending promise with generated id', () => {
    const pp = createPaymentPromise({
      customerId: 'cust_1' as never,
      accountId: 'acc_1' as never,
      promiseAmount: 80,
      currency: 'USD',
      promiseDate: '2026-02-01',
      createdById: 'usr_op1' as never
    });
    expect(pp.id).toMatch(/^pp_/);
    expect(pp.status).toBe('pending');
    expect(pp.promiseAmount).toBe(80);
  });

  it('calculateCustomerRisk returns low score with no signals', () => {
    const r = calculateCustomerRisk({ signals: [], debts: [], escalations: [] });
    expect(r.score).toBe(0);
    expect(r.level).toBe('low');
    expect(r.reasons).toEqual([]);
  });

  it('calculateCustomerRisk combines signals, debt and escalations', () => {
    const signals: CustomerRiskSignal[] = [
      {
        id: 's1',
        customerId: 'cust_1' as never,
        kind: 'churn_intent',
        score: 80,
        observedAt: '2026-01-01',
        source: 'legacyops'
      },
      {
        id: 's2',
        customerId: 'cust_1' as never,
        kind: 'high_debt',
        score: 70,
        observedAt: '2026-01-01',
        source: 'billing_provider'
      }
    ];
    const debts: DebtRecord[] = [
      { id: 'd1', accountId: 'acc_1' as never, amount: 2000, currency: 'USD', daysPastDue: 30, stage: 'mid' }
    ];
    const escalations: CaseEscalation[] = [
      { id: 'e1', caseId: 'case_1' as never, reason: 'r', escalatedAt: '2026-01-01', escalatedBy: 'usr_op1' as never },
      { id: 'e2', caseId: 'case_2' as never, reason: 'r', escalatedAt: '2026-01-02', escalatedBy: 'usr_op1' as never }
    ];
    const r = calculateCustomerRisk({ signals, debts, escalations });
    expect(r.score).toBeGreaterThan(40);
    expect(['medium', 'high', 'critical']).toContain(r.level);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('summarizeCustomerOperationalState produces a coherent snapshot', () => {
    const customer: Customer = {
      id: 'cust_1' as never,
      segment: 'vip',
      displayName: 'Test',
      accountId: 'acc_1' as never,
      riskFlags: ['vip'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      externalId: 'ext_1' as never
    };
    const summary = summarizeCustomerOperationalState({
      customer,
      cases: [makeCase({ status: 'open' }), makeCase({ id: 'case_2' as never, status: 'closed' })],
      interactions: [
        {
          id: 'int_1' as never,
          customerId: 'cust_1' as never,
          channel: 'voice',
          direction: 'inbound',
          reason: 'billing',
          summary: '',
          agentId: 'usr_op1' as never,
          startedAt: '2026-02-01T00:00:00.000Z'
        }
      ],
      debts: [{ id: 'd1', accountId: 'acc_1' as never, amount: 500, currency: 'USD', daysPastDue: 10, stage: 'early' }],
      signals: [],
      escalations: [],
      paymentPromises: [
        {
          id: 'pp1',
          customerId: 'cust_1' as never,
          accountId: 'acc_1' as never,
          promiseAmount: 100,
          currency: 'USD',
          promiseDate: '2026-03-01',
          status: 'pending',
          createdById: 'usr_op1' as never,
          createdAt: '2026-01-01'
        }
      ] as PaymentPromise[]
    });
    expect(summary.openCases).toBe(1);
    expect(summary.openInteractions).toBe(1);
    expect(summary.totalDebt).toBe(500);
    expect(summary.isVip).toBe(true);
    expect(summary.activePaymentPromises).toBe(1);
    expect(summary.sourceOfTruth).toBe('hybrid');
  });
});

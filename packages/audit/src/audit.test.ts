import { describe, it, expect } from 'vitest';
import { AuditEvents, InMemoryAuditLog, createAuditEvent } from '@legacyops/audit';

describe('audit event creation', () => {
  it('creates a customer.viewed event', () => {
    const e = AuditEvents.customerViewed('usr_op1' as never, 'operator', 'cust_1');
    expect(e.type).toBe('customer.viewed');
    expect(e.target?.id).toBe('cust_1');
    expect(e.occurredAt).toBeTruthy();
  });

  it('creates a case.created event with metadata', () => {
    const e = AuditEvents.caseCreated('usr_op1' as never, 'operator', 'case_1', 'cust_1', 'billing_claim');
    expect(e.type).toBe('case.created');
    expect(e.metadata).toMatchObject({ customerId: 'cust_1', category: 'billing_claim' });
  });

  it('appends to and reads from the in-memory log', () => {
    const log = new InMemoryAuditLog();
    log.append(createAuditEvent({ type: 'workflow.started', actorId: 'usr_op1' as never, actorRole: 'operator' }));
    log.append(AuditEvents.caseCreated('usr_op1' as never, 'operator', 'case_2', 'cust_1', 'general_inquiry'));
    expect(log.count()).toBe(2);
    expect(log.list({ type: 'case.created' }).length).toBe(1);
  });

  it('records external adapter calls', () => {
    const e = AuditEvents.externalAdapterCall(
      'usr_op1' as never,
      'operator',
      'siebel-bridge',
      'searchContacts',
      120,
      true
    );
    expect(e.metadata).toMatchObject({ adapter: 'siebel-bridge', durationMs: 120, success: true });
  });

  it('creates a workflow.cancelled event with runId', () => {
    const e = AuditEvents.workflowCancelled('usr_op1' as never, 'operator', 'wfr_123');
    expect(e.type).toBe('workflow.cancelled');
    expect(e.target?.id).toBe('wfr_123');
    expect(e.metadata).toMatchObject({ workflowRunId: 'wfr_123', reason: undefined });
  });

  it('creates a workflow.cancelled event with reason', () => {
    const e = AuditEvents.workflowCancelled(
      'usr_op1' as never,
      'operator',
      'wfr_456',
      'customer requested cancellation'
    );
    expect(e.type).toBe('workflow.cancelled');
    expect(e.metadata).toMatchObject({
      workflowRunId: 'wfr_456',
      reason: 'customer requested cancellation'
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  completeWorkflowStep,
  findDemoWorkflow,
  startWorkflow,
  WorkflowValidationError,
  listDemoWorkflows
} from '@legacyops/workflows';

describe('workflow validation', () => {
  it('starts and completes a workflow run', () => {
    const wf = findDemoWorkflow('wf_billing_claim')!;
    const run = startWorkflow({ workflow: wf, customerId: 'cust_test' as never, agentId: 'usr_operator1' as never });
    expect(run.status).toBe('active');
    expect(run.steps[0].status).toBe('active');

    const next = completeWorkflowStep(run, wf, wf.steps[0].id, {
      invoiceId: 'inv_1',
      disputeReason: 'overcharged'
    });
    expect(next.steps[0].status).toBe('completed');
    expect(next.steps[1].status).toBe('active');
  });

  it('fails when required fields are missing', () => {
    const wf = findDemoWorkflow('wf_billing_claim')!;
    const run = startWorkflow({ workflow: wf, customerId: 'cust_test' as never, agentId: 'usr_operator1' as never });
    expect(() => completeWorkflowStep(run, wf, wf.steps[0].id, { invoiceId: 'inv_1' })).toThrow(
      WorkflowValidationError
    );
  });

  it('completes all steps to mark the run completed', () => {
    const wf = findDemoWorkflow('wf_payment_promise')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_test' as never, agentId: 'usr_operator1' as never });
    run = completeWorkflowStep(run, wf, wf.steps[0].id, { debtId: 'debt_1', totalAmount: 100 });
    run = completeWorkflowStep(run, wf, wf.steps[1].id, { promiseAmount: 80, promiseDate: '2026-02-01' });
    run = completeWorkflowStep(run, wf, wf.steps[2].id, { registered: true, confirmedByCustomer: true });
    expect(run.status).toBe('completed');
    expect(run.completedAt).toBeDefined();
  });

  it('lists demo workflows', () => {
    expect(listDemoWorkflows().length).toBeGreaterThanOrEqual(4);
  });
});

/**
 * Tests for the extended workflow capabilities (B5):
 * - conditional next step
 * - required role per step
 * - workflow summary
 * - cancel run
 * - new demo workflows (service_order_followup, legacy_data_reconciliation)
 */

import { describe, it, expect } from 'vitest';
import {
  canCompleteStep,
  cancelWorkflowRun,
  completeWorkflowStep,
  findDemoWorkflow,
  listDemoWorkflows,
  startWorkflow,
  summarizeWorkflowRun,
  StepRoleDeniedError,
  WorkflowValidationError
} from '@legacyops/workflows';

describe('extended workflows (B5)', () => {
  it('lists 6 demo workflows including the new ones', () => {
    const ids = listDemoWorkflows().map((w) => w.id);
    expect(ids).toContain('wf_billing_claim');
    expect(ids).toContain('wf_cancellation_retention');
    expect(ids).toContain('wf_payment_promise');
    expect(ids).toContain('wf_technical_complaint');
    expect(ids).toContain('wf_service_order_followup');
    expect(ids).toContain('wf_legacy_data_reconciliation');
  });

  it('service_order_followup jumps to verify_completion when status is completed (conditional next)', () => {
    const wf = findDemoWorkflow('wf_service_order_followup')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_op1' as never });
    // Step 1: identify_order
    run = completeWorkflowStep(run, wf, 'identify_order', {
      serviceOrderId: 'so_1',
      type: 'install'
    });
    expect(run.steps[0].status).toBe('completed');
    expect(run.steps[1].status).toBe('active'); // check_status

    // Step 2: check_status with currentStatus=completed -> jump to verify_completion (skip schedule_followup)
    run = completeWorkflowStep(run, wf, 'check_status', {
      currentStatus: 'completed',
      lastUpdatedAt: '2026-01-01'
    });
    expect(run.steps[1].status).toBe('completed');
    // schedule_followup (index 2) should NOT be active; verify_completion (index 3) should be active
    expect(run.steps[2].status).toBe('pending');
    expect(run.steps[3].status).toBe('active');
  });

  it('service_order_followup falls through to schedule_followup when status is NOT completed', () => {
    const wf = findDemoWorkflow('wf_service_order_followup')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_op1' as never });
    run = completeWorkflowStep(run, wf, 'identify_order', { serviceOrderId: 'so_1', type: 'install' });
    run = completeWorkflowStep(run, wf, 'check_status', {
      currentStatus: 'in_progress',
      lastUpdatedAt: '2026-01-01'
    });
    expect(run.steps[2].status).toBe('active'); // schedule_followup
    expect(run.steps[3].status).toBe('pending');
  });

  it('legacy_data_reconciliation skips resolve_conflicts when conflictCount=0', () => {
    const wf = findDemoWorkflow('wf_legacy_data_reconciliation')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_back' as never });
    run = completeWorkflowStep(run, wf, 'pick_record', {
      entity: 'Case',
      internalId: 'case_1',
      externalId: 'ext_sr_1'
    });
    run = completeWorkflowStep(run, wf, 'fetch_both', {
      internalSnapshot: { subject: 'A' },
      externalSnapshot: { subject: 'A' }
    });
    run = completeWorkflowStep(run, wf, 'diff_fields', {
      diffSummary: 'no differences',
      conflictCount: 0
    });
    run = completeWorkflowStep(run, wf, 'decide_source_of_truth', {
      ownerSystem: 'legacyops',
      reason: 'no conflicts'
    });
    // resolve_conflicts (index 4) should be skipped-pending; finalize (index 5) should be active
    expect(run.steps[4].status).toBe('pending');
    expect(run.steps[5].status).toBe('active');
  });

  it('canCompleteStep respects requiredRole', () => {
    const wf = findDemoWorkflow('wf_service_order_followup')!;
    // identify_order requires operator
    expect(canCompleteStep(wf, 'identify_order', 'operator')).toBe(true);
    expect(canCompleteStep(wf, 'identify_order', 'auditor')).toBe(false);
    // schedule_followup requires senior_operator
    expect(canCompleteStep(wf, 'schedule_followup', 'operator')).toBe(false);
    expect(canCompleteStep(wf, 'schedule_followup', 'senior_operator')).toBe(true);
    // admin can always complete
    expect(canCompleteStep(wf, 'schedule_followup', 'admin')).toBe(true);
  });

  it('summarizeWorkflowRun produces a coherent summary', () => {
    const wf = findDemoWorkflow('wf_payment_promise')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_op1' as never });
    run = completeWorkflowStep(run, wf, 'review_debt', { debtId: 'debt_1', totalAmount: 100 });
    const summary = summarizeWorkflowRun(run, wf);
    expect(summary.runId).toBe(run.id);
    expect(summary.workflowName).toBe('Payment Promise');
    expect(summary.status).toBe('active');
    expect(summary.totalSteps).toBe(3);
    expect(summary.completedSteps).toBe(1);
    expect(summary.activeStep).toBe('negotiate_terms');
    expect(summary.pendingSteps).toContain('register_promise');
    expect(summary.nextStepHint).toMatch(/promiseAmount/);
  });

  it('cancelWorkflowRun moves status to cancelled', () => {
    const wf = findDemoWorkflow('wf_billing_claim')!;
    const run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_op1' as never });
    const cancelled = cancelWorkflowRun(run);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.completedAt).toBeTruthy();
  });

  it('cancelWorkflowRun refuses to cancel a completed run', () => {
    const wf = findDemoWorkflow('wf_payment_promise')!;
    let run = startWorkflow({ workflow: wf, customerId: 'cust_1' as never, agentId: 'usr_op1' as never });
    run = completeWorkflowStep(run, wf, 'review_debt', { debtId: 'd1', totalAmount: 100 });
    run = completeWorkflowStep(run, wf, 'negotiate_terms', { promiseAmount: 80, promiseDate: '2026-02-01' });
    run = completeWorkflowStep(run, wf, 'register_promise', { registered: true, confirmedByCustomer: true });
    expect(run.status).toBe('completed');
    expect(() => cancelWorkflowRun(run)).toThrow(WorkflowValidationError);
  });

  it('StepRoleDeniedError carries step, required and actual role', () => {
    const err = new StepRoleDeniedError('schedule_followup', 'senior_operator', 'operator');
    expect(err.stepId).toBe('schedule_followup');
    expect(err.requiredRole).toBe('senior_operator');
    expect(err.actualRole).toBe('operator');
    expect(err.message).toMatch(/senior_operator/);
  });
});

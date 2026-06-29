/**
 * @legacyops/workflows — Minimal but real workflow engine.
 *
 * A workflow is an ordered list of steps, each declaring its required fields.
 * `startWorkflow` creates a run; `completeWorkflowStep` validates captured
 * fields, advances the cursor and (when the last step completes) marks the
 * run as completed.
 */

import type {
  CaseCategory,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunStatus,
  WorkflowRunStep,
  WorkflowStepDefinition
} from '@legacyops/domain';
import type { CaseId, CustomerId, UserId, WorkflowRunId } from '@legacyops/shared';
import { id, nowIso } from '@legacyops/shared';

export type { WorkflowDefinition, WorkflowRun, WorkflowRunStep, WorkflowStepDefinition };

export class WorkflowValidationError extends Error {
  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'WorkflowValidationError';
  }
}

export function validateStepFields(
  step: WorkflowStepDefinition,
  capturedFields: Record<string, unknown>
): void {
  const missing: string[] = [];
  for (const field of step.requiredFields) {
    const v = capturedFields[field];
    if (v === undefined || v === null || v === '') missing.push(field);
  }
  if (missing.length > 0) {
    throw new WorkflowValidationError(
      `Missing required fields for step "${step.label}"`,
      { stepId: step.id, missing }
    );
  }
}

export function validateWorkflow(def: WorkflowDefinition): void {
  if (!def.steps.length) {
    throw new WorkflowValidationError(`Workflow "${def.name}" has no steps`);
  }
  const ids = new Set<string>();
  for (const s of def.steps) {
    if (ids.has(s.id)) {
      throw new WorkflowValidationError(`Duplicate step id "${s.id}" in workflow "${def.name}"`);
    }
    ids.add(s.id);
  }
}

export interface StartWorkflowInput {
  workflow: WorkflowDefinition;
  customerId: CustomerId;
  agentId: UserId;
  caseId?: CaseId;
}

export function startWorkflow(input: StartWorkflowInput): WorkflowRun {
  validateWorkflow(input.workflow);
  const steps: WorkflowRunStep[] = input.workflow.steps.map((s, idx) => ({
    stepId: s.id,
    status: idx === 0 ? 'active' : 'pending',
    capturedFields: {},
    startedAt: idx === 0 ? nowIso() : undefined
  }));
  return {
    id: id('wfr') as WorkflowRunId,
    workflowId: input.workflow.id,
    workflowName: input.workflow.name,
    caseId: input.caseId,
    customerId: input.customerId,
    agentId: input.agentId,
    status: 'active',
    startedAt: nowIso(),
    steps
  };
}

export function findStepDefinition(run: WorkflowRun, def: WorkflowDefinition, stepId: string): WorkflowStepDefinition {
  const def_ = def.steps.find((s) => s.id === stepId);
  if (!def_) {
    throw new WorkflowValidationError(`Step "${stepId}" not found in workflow "${def.name}"`);
  }
  return def_;
}

export function completeWorkflowStep(
  run: WorkflowRun,
  def: WorkflowDefinition,
  stepId: string,
  capturedFields: Record<string, unknown>
): WorkflowRun {
  if (run.status !== 'active') {
    throw new WorkflowValidationError(`Cannot complete step on a run in status "${run.status}"`);
  }
  const stepDef = findStepDefinition(run, def, stepId);
  validateStepFields(stepDef, capturedFields);

  const stepIdx = run.steps.findIndex((s) => s.stepId === stepId);
  if (stepIdx < 0) {
    throw new WorkflowValidationError(`Step "${stepId}" is not part of this workflow run`);
  }
  const step = run.steps[stepIdx];
  if (step.status !== 'active' && step.status !== 'pending') {
    throw new WorkflowValidationError(`Step "${stepId}" is in status "${step.status}" and cannot be completed`);
  }

  const now = nowIso();
  const newSteps: WorkflowRunStep[] = run.steps.map((s, idx) => {
    if (idx === stepIdx) {
      return { ...s, status: 'completed', capturedFields: { ...capturedFields }, completedAt: now };
    }
    if (idx === stepIdx + 1 && s.status === 'pending') {
      return { ...s, status: 'active', startedAt: now };
    }
    return s;
  });

  const allCompleted = newSteps.every((s) => s.status === 'completed' || s.status === 'skipped');
  const nextStatus: WorkflowRunStatus = allCompleted ? 'completed' : 'active';

  return {
    ...run,
    steps: newSteps,
    status: nextStatus,
    completedAt: nextStatus === 'completed' ? now : undefined
  };
}

export function cancelWorkflowRun(run: WorkflowRun): WorkflowRun {
  if (run.status === 'completed' || run.status === 'cancelled') {
    throw new WorkflowValidationError(`Cannot cancel a run in status "${run.status}"`);
  }
  return { ...run, status: 'cancelled', completedAt: nowIso() };
}

// ---------- Demo workflow definitions ----------
const billingClaim: WorkflowDefinition = {
  id: 'wf_billing_claim',
  name: 'Billing Claim',
  category: 'billing_claim',
  description: 'Guides the operator through a billing dispute, validation and credit decision.',
  createdAt: '2026-01-01T00:00:00.000Z',
  steps: [
    {
      id: 'identify_invoice',
      label: 'Identify invoice',
      description: 'Confirm the disputed invoice with the customer.',
      requiredFields: ['invoiceId', 'disputeReason']
    },
    {
      id: 'validate_claim',
      label: 'Validate claim',
      description: 'Check billing backend, contracts and previous disputes.',
      requiredFields: ['valid', 'evidence']
    },
    {
      id: 'decide_credit',
      label: 'Decide credit',
      description: 'Approve, reject or partial-credit the disputed amount.',
      requiredFields: ['decision', 'creditAmount']
    },
    {
      id: 'notify_customer',
      label: 'Notify customer',
      description: 'Communicate decision through the chosen channel.',
      requiredFields: ['channel', 'confirmationText']
    }
  ]
};

const cancellationRetention: WorkflowDefinition = {
  id: 'wf_cancellation_retention',
  name: 'Cancellation & Retention',
  category: 'cancellation_retention',
  description: 'Handles customer cancellation requests with retention offers.',
  createdAt: '2026-01-01T00:00:00.000Z',
  steps: [
    {
      id: 'capture_reason',
      label: 'Capture cancellation reason',
      requiredFields: ['reason', 'intentStrength']
    },
    {
      id: 'check_eligibility',
      label: 'Check retention eligibility',
      requiredFields: ['eligible', 'offerId']
    },
    {
      id: 'present_offer',
      label: 'Present retention offer',
      requiredFields: ['offerPresented', 'customerResponse']
    },
    {
      id: 'finalize',
      label: 'Finalize',
      requiredFields: ['outcome']
    }
  ]
};

const paymentPromise: WorkflowDefinition = {
  id: 'wf_payment_promise',
  name: 'Payment Promise',
  category: 'payment_promise',
  description: 'Negotiates and registers a payment promise for overdue debt.',
  createdAt: '2026-01-01T00:00:00.000Z',
  steps: [
    {
      id: 'review_debt',
      label: 'Review debt',
      requiredFields: ['debtId', 'totalAmount']
    },
    {
      id: 'negotiate_terms',
      label: 'Negotiate terms',
      requiredFields: ['promiseAmount', 'promiseDate']
    },
    {
      id: 'register_promise',
      label: 'Register promise',
      requiredFields: ['registered', 'confirmedByCustomer']
    }
  ]
};

const technicalComplaint: WorkflowDefinition = {
  id: 'wf_technical_complaint',
  name: 'Technical Complaint',
  category: 'technical_complaint',
  description: 'Triage, reproduce and resolve technical complaints.',
  createdAt: '2026-01-01T00:00:00.000Z',
  steps: [
    {
      id: 'capture_symptom',
      label: 'Capture symptom',
      requiredFields: ['serviceId', 'symptom']
    },
    {
      id: 'reproduce',
      label: 'Reproduce',
      requiredFields: ['reproduced', 'notes']
    },
    {
      id: 'diagnose',
      label: 'Diagnose',
      requiredFields: ['rootCause', 'severity']
    },
    {
      id: 'resolve_or_dispatch',
      label: 'Resolve or dispatch',
      requiredFields: ['resolution', 'dispatchNeeded']
    }
  ]
};

export const DEMO_WORKFLOWS: Record<CaseCategory, WorkflowDefinition[]> = {
  billing_claim: [billingClaim],
  cancellation_retention: [cancellationRetention],
  payment_promise: [paymentPromise],
  technical_complaint: [technicalComplaint],
  service_request: [],
  general_inquiry: [],
  complaint: []
};

export function listDemoWorkflows(): WorkflowDefinition[] {
  return [billingClaim, cancellationRetention, paymentPromise, technicalComplaint];
}

export function findDemoWorkflow(id: string): WorkflowDefinition | undefined {
  return listDemoWorkflows().find((w) => w.id === id);
}

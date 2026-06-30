/**
 * @legacyops/audit — Audit event factory and helpers.
 *
 * Every state-changing operator action must produce an AuditEvent. The audit
 * log is the source of truth for compliance, dispute resolution and ROI
 * measurement (see docs/ROI_METRICS.md).
 */

import type { AuditEvent, AuditEventType } from '@legacyops/domain';
import type { AuditEventId, UserId } from '@legacyops/shared';
import { id, nowIso } from '@legacyops/shared';

export type { AuditEvent, AuditEventType } from '@legacyops/domain';

export interface CreateAuditEventInput {
  type: AuditEventType;
  actorId: UserId;
  actorRole: string;
  target?: { kind: string; id: string };
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export function createAuditEvent(input: CreateAuditEventInput): AuditEvent {
  return {
    id: id('aud') as AuditEventId,
    type: input.type,
    actorId: input.actorId,
    actorRole: input.actorRole,
    occurredAt: nowIso(),
    target: input.target,
    metadata: input.metadata,
    correlationId: input.correlationId
  };
}

// ---------- Convenience builders ----------
export const AuditEvents = {
  customerViewed: (actorId: UserId, actorRole: string, customerId: string): AuditEvent =>
    createAuditEvent({
      type: 'customer.viewed',
      actorId,
      actorRole,
      target: { kind: 'Customer', id: customerId }
    }),

  caseCreated: (actorId: UserId, actorRole: string, caseId: string, customerId: string, category: string): AuditEvent =>
    createAuditEvent({
      type: 'case.created',
      actorId,
      actorRole,
      target: { kind: 'Case', id: caseId },
      metadata: { customerId, category }
    }),

  caseUpdated: (actorId: UserId, actorRole: string, caseId: string, changes: Record<string, unknown>): AuditEvent =>
    createAuditEvent({
      type: 'case.updated',
      actorId,
      actorRole,
      target: { kind: 'Case', id: caseId },
      metadata: { changes }
    }),

  caseAssigned: (
    actorId: UserId,
    actorRole: string,
    caseId: string,
    toAssigneeId: string | undefined,
    queueId: string | undefined,
    reason: string
  ): AuditEvent =>
    createAuditEvent({
      type: 'case.assigned',
      actorId,
      actorRole,
      target: { kind: 'Case', id: caseId },
      metadata: { toAssigneeId, queueId, reason }
    }),

  caseEscalated: (
    actorId: UserId,
    actorRole: string,
    caseId: string,
    toAssigneeId: string | undefined,
    toQueueId: string | undefined,
    reason: string
  ): AuditEvent =>
    createAuditEvent({
      type: 'case.escalated',
      actorId,
      actorRole,
      target: { kind: 'Case', id: caseId },
      metadata: { toAssigneeId, toQueueId, reason }
    }),

  caseCommentAdded: (
    actorId: UserId,
    actorRole: string,
    caseId: string,
    commentId: string,
    internal: boolean
  ): AuditEvent =>
    createAuditEvent({
      type: 'case.comment_added',
      actorId,
      actorRole,
      target: { kind: 'Case', id: caseId },
      metadata: { commentId, internal }
    }),

  interactionStarted: (
    actorId: UserId,
    actorRole: string,
    interactionId: string,
    customerId: string,
    channel: string,
    reason: string
  ): AuditEvent =>
    createAuditEvent({
      type: 'interaction.started',
      actorId,
      actorRole,
      target: { kind: 'Interaction', id: interactionId },
      metadata: { customerId, channel, reason }
    }),

  interactionClosed: (
    actorId: UserId,
    actorRole: string,
    interactionId: string,
    outcome: string | undefined
  ): AuditEvent =>
    createAuditEvent({
      type: 'interaction.closed',
      actorId,
      actorRole,
      target: { kind: 'Interaction', id: interactionId },
      metadata: { outcome }
    }),

  workflowStarted: (
    actorId: UserId,
    actorRole: string,
    runId: string,
    workflowId: string,
    customerId: string
  ): AuditEvent =>
    createAuditEvent({
      type: 'workflow.started',
      actorId,
      actorRole,
      target: { kind: 'WorkflowRun', id: runId },
      metadata: { workflowId, customerId }
    }),

  workflowStepCompleted: (actorId: UserId, actorRole: string, runId: string, stepId: string): AuditEvent =>
    createAuditEvent({
      type: 'workflow.step_completed',
      actorId,
      actorRole,
      target: { kind: 'WorkflowRun', id: runId },
      metadata: { stepId }
    }),

  workflowCancelled: (actorId: UserId, actorRole: string, runId: string, reason?: string): AuditEvent =>
    createAuditEvent({
      type: 'workflow.cancelled',
      actorId,
      actorRole,
      target: { kind: 'WorkflowRun', id: runId },
      metadata: { workflowRunId: runId, reason }
    }),

  permissionDenied: (actorId: UserId, actorRole: string, permission: string, resource?: string): AuditEvent =>
    createAuditEvent({
      type: 'permission.denied',
      actorId,
      actorRole,
      metadata: { permission, resource }
    }),

  externalAdapterCall: (
    actorId: UserId,
    actorRole: string,
    adapter: string,
    operation: string,
    durationMs: number,
    success: boolean
  ): AuditEvent =>
    createAuditEvent({
      type: 'external.adapter_call',
      actorId,
      actorRole,
      metadata: { adapter, operation, durationMs, success }
    }),

  aiSuggestionGenerated: (actorId: UserId, actorRole: string, kind: string, customerId?: string): AuditEvent =>
    createAuditEvent({
      type: 'ai.suggestion_generated',
      actorId,
      actorRole,
      target: customerId ? { kind: 'Customer', id: customerId } : undefined,
      metadata: { kind }
    }),

  migrationEvent: (
    actorId: UserId,
    actorRole: string,
    event: 'dry_run' | 'started' | 'conflict_detected' | 'reconciled' | 'rolled_back' | 'completed',
    runId: string,
    details?: Record<string, unknown>
  ): AuditEvent =>
    createAuditEvent({
      type: 'migration.event',
      actorId,
      actorRole,
      target: { kind: 'MigrationRun', id: runId },
      metadata: { event, ...details }
    })
};

// ---------- In-memory audit log (sufficient for synthetic mode) ----------
export class InMemoryAuditLog {
  private events: AuditEvent[] = [];

  append(event: AuditEvent): void {
    this.events.push(event);
  }

  appendMany(events: AuditEvent[]): void {
    for (const e of events) this.events.push(e);
  }

  list(filter?: { type?: AuditEventType; actorId?: UserId; targetId?: string }): AuditEvent[] {
    return this.events.filter((e) => {
      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.actorId && e.actorId !== filter.actorId) return false;
      if (filter?.targetId && e.target?.id !== filter.targetId) return false;
      return true;
    });
  }

  count(): number {
    return this.events.length;
  }

  clear(): void {
    this.events = [];
  }
}

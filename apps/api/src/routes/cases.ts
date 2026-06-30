import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { id as makeId, nowIso } from '@legacyops/shared';
import { AuditEvents } from '@legacyops/audit';
import type { Case, CaseComment } from '@legacyops/domain';
import { assignCaseToQueue, escalateCase } from '@legacyops/domain';
import { withPermission } from '../rbac.js';

export async function registerCaseRoutes(app: FastifyInstance, state: AppState) {
  app.get('/cases', { preHandler: withPermission('customer:read') }, async (req) => {
    const q = req.query as { customerId?: string; status?: string; category?: string };
    let items = state.dataset.cases;
    if (q.customerId) items = items.filter((c) => c.customerId === q.customerId);
    if (q.status) items = items.filter((c) => c.status === q.status);
    if (q.category) items = items.filter((c) => c.category === q.category);
    return { items };
  });

  app.get('/cases/:id', { preHandler: withPermission('customer:read') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const c = state.dataset.cases.find((x) => x.id === id);
    if (!c) {
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: `Case ${id} not found` } });
    }
    const comments = state.dataset.caseComments?.filter((cc) => cc.caseId === c.id) ?? [];
    return { case: c, comments };
  });

  app.post('/cases', { preHandler: withPermission('case:create') }, async (req, reply) => {
    const body = req.body as Partial<Case> & { actorId?: string; actorRole?: string };
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    if (!body.customerId || !body.subject || !body.category) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'BAD_REQUEST', message: 'customerId, subject and category are required' }
      });
    }
    const now = nowIso();
    const newCase: Case = {
      id: makeId('case') as Case['id'],
      customerId: body.customerId,
      accountId: body.accountId,
      status: 'open',
      priority: body.priority ?? 'normal',
      category: body.category,
      subject: body.subject,
      description: body.description ?? '',
      assigneeId: body.assigneeId,
      queueId: body.queueId,
      slaDueAt: body.slaDueAt ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now
    };
    state.dataset.cases.push(newCase);
    state.auditLog.append(
      AuditEvents.caseCreated(
        (body.actorId ?? actorId ?? 'usr_system') as never,
        body.actorRole ?? role,
        newCase.id,
        newCase.customerId,
        newCase.category
      )
    );
    return { ok: true, data: newCase };
  });

  app.patch('/cases/:id', { preHandler: withPermission('case:update') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as Partial<Case> & { actorId?: string; actorRole?: string };
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    const c = state.dataset.cases.find((x) => x.id === id);
    if (!c) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Case not found' } });
    const changes: Record<string, unknown> = {};
    for (const k of ['status', 'priority', 'subject', 'description', 'assigneeId', 'queueId'] as const) {
      if (body[k] !== undefined) {
        (c as unknown as Record<string, unknown>)[k] = body[k];
        changes[k] = body[k];
      }
    }
    c.updatedAt = nowIso();
    state.auditLog.append(
      AuditEvents.caseUpdated((body.actorId ?? actorId ?? 'usr_system') as never, body.actorRole ?? role, c.id, changes)
    );
    return { ok: true, data: c };
  });

  // ---------- Case comments (B4) ----------
  app.post('/cases/:id/comments', { preHandler: withPermission('case:update') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { body?: string; internal?: boolean; actorId?: string; actorRole?: string };
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    const c = state.dataset.cases.find((x) => x.id === id);
    if (!c) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Case not found' } });
    if (!body.body || !body.body.trim()) {
      return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'body is required' } });
    }
    const comment: CaseComment = {
      id: makeId('cc'),
      caseId: c.id,
      authorId: (body.actorId ?? actorId ?? 'usr_system') as never,
      body: body.body,
      internal: body.internal ?? false,
      createdAt: nowIso()
    };
    if (!state.dataset.caseComments) state.dataset.caseComments = [];
    state.dataset.caseComments.push(comment);
    c.updatedAt = nowIso();
    state.auditLog.append(
      AuditEvents.caseCommentAdded(
        (body.actorId ?? actorId ?? 'usr_system') as never,
        body.actorRole ?? role,
        c.id,
        comment.id,
        comment.internal
      )
    );
    return { ok: true, data: comment };
  });

  app.get('/cases/:id/comments', { preHandler: withPermission('customer:read') }, async (req) => {
    const id = (req.params as { id: string }).id;
    const comments = (state.dataset.caseComments ?? []).filter((cc) => cc.caseId === id);
    return { items: comments };
  });

  // ---------- Case assign (B4) ----------
  app.post('/cases/:id/assign', { preHandler: withPermission('case:assign') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as {
      assigneeId?: string;
      queueId?: string;
      reason?: string;
      actorId?: string;
      actorRole?: string;
    };
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    const c = state.dataset.cases.find((x) => x.id === id);
    if (!c) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Case not found' } });
    const { caseEntity, assignment } = assignCaseToQueue({
      caseEntity: c,
      queueId: body.queueId,
      assigneeId: body.assigneeId as never,
      reason: 'manual',
      actorId: (body.actorId ?? actorId ?? 'usr_system') as never
    });
    // Replace the case in the dataset
    const idx = state.dataset.cases.findIndex((x) => x.id === id);
    state.dataset.cases[idx] = caseEntity;
    if (!state.dataset.queueAssignments) state.dataset.queueAssignments = [];
    state.dataset.queueAssignments.push(assignment);
    state.auditLog.append(
      AuditEvents.caseAssigned(
        (body.actorId ?? actorId ?? 'usr_system') as never,
        body.actorRole ?? role,
        caseEntity.id,
        body.assigneeId,
        body.queueId,
        body.reason ?? 'manual'
      )
    );
    return { ok: true, data: { case: caseEntity, assignment } };
  });

  // ---------- Case escalate (B4) ----------
  app.post('/cases/:id/escalate', { preHandler: withPermission('case:escalate') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as {
      toAssigneeId?: string;
      toQueueId?: string;
      reason?: string;
      actorId?: string;
      actorRole?: string;
    };
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    const c = state.dataset.cases.find((x) => x.id === id);
    if (!c) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Case not found' } });
    const { caseEntity, escalation } = escalateCase({
      caseEntity: c,
      toAssigneeId: body.toAssigneeId as never,
      toQueueId: body.toQueueId,
      reason: body.reason ?? 'escalated by operator',
      escalatedBy: (body.actorId ?? actorId ?? 'usr_system') as never
    });
    const idx = state.dataset.cases.findIndex((x) => x.id === id);
    state.dataset.cases[idx] = caseEntity;
    if (!state.dataset.caseEscalations) state.dataset.caseEscalations = [];
    state.dataset.caseEscalations.push(escalation);
    state.auditLog.append(
      AuditEvents.caseEscalated(
        (body.actorId ?? actorId ?? 'usr_system') as never,
        body.actorRole ?? role,
        caseEntity.id,
        body.toAssigneeId,
        body.toQueueId,
        body.reason ?? 'escalated by operator'
      )
    );
    return { ok: true, data: { case: caseEntity, escalation } };
  });
}

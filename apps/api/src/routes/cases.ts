import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { id as makeId, nowIso } from '@legacyops/shared';
import { AuditEvents } from '@legacyops/audit';
import type { Case } from '@legacyops/domain';

export async function registerCaseRoutes(app: FastifyInstance, state: AppState) {
  app.get('/cases', async (req) => {
    const q = req.query as { customerId?: string; status?: string; category?: string };
    let items = state.dataset.cases;
    if (q.customerId) items = items.filter((c) => c.customerId === q.customerId);
    if (q.status) items = items.filter((c) => c.status === q.status);
    if (q.category) items = items.filter((c) => c.category === q.category);
    return { items };
  });

  app.post('/cases', async (req, reply) => {
    const body = req.body as Partial<Case> & { actorId?: string; actorRole?: string };
    if (!body.customerId || !body.subject || !body.category) {
      return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'customerId, subject and category are required' } });
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
        (body.actorId ?? 'usr_system') as never,
        body.actorRole ?? 'system',
        newCase.id,
        newCase.customerId,
        newCase.category
      )
    );
    return { ok: true, data: newCase };
  });

  app.patch('/cases/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as Partial<Case> & { actorId?: string; actorRole?: string };
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
      AuditEvents.caseUpdated((body.actorId ?? 'usr_system') as never, body.actorRole ?? 'system', c.id, changes)
    );
    return { ok: true, data: c };
  });
}

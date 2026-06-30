import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { id as makeId, nowIso } from '@legacyops/shared';
import type { Interaction } from '@legacyops/domain';
import { withPermission } from '../rbac.js';

export async function registerInteractionRoutes(app: FastifyInstance, state: AppState) {
  app.post('/interactions', { preHandler: withPermission('case:create') }, async (req, reply) => {
    const body = req.body as Partial<Interaction> & { actorId?: string; actorRole?: string };
    if (!body.customerId || !body.channel || !body.reason) {
      return reply
        .status(400)
        .send({ ok: false, error: { code: 'BAD_REQUEST', message: 'customerId, channel and reason are required' } });
    }
    const now = nowIso();
    const interaction: Interaction = {
      id: makeId('int') as Interaction['id'],
      customerId: body.customerId,
      caseId: body.caseId,
      channel: body.channel,
      direction: body.direction ?? 'inbound',
      reason: body.reason,
      summary: body.summary ?? '',
      agentId: (body.agentId ?? 'usr_operator1') as Interaction['agentId'],
      startedAt: now,
      outcome: body.outcome
    };
    state.dataset.interactions.push(interaction);
    return { ok: true, data: interaction };
  });

  app.get('/interactions', { preHandler: withPermission('customer:read') }, async (req) => {
    const q = req.query as { customerId?: string; caseId?: string };
    let items = state.dataset.interactions;
    if (q.customerId) items = items.filter((i) => i.customerId === q.customerId);
    if (q.caseId) items = items.filter((i) => i.caseId === q.caseId);
    return { items };
  });
}

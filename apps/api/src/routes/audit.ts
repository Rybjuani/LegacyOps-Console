import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { paginate } from '@legacyops/shared';

export async function registerAuditRoutes(app: FastifyInstance, state: AppState) {
  app.get('/audit-events', async (req) => {
    const q = req.query as { type?: string; actorId?: string; page?: string; pageSize?: string };
    let items = state.auditLog.list();
    if (q.type) items = items.filter((e) => e.type === q.type);
    if (q.actorId) items = items.filter((e) => e.actorId === q.actorId);
    const page = Number(q.page ?? 1);
    const pageSize = Number(q.pageSize ?? 50);
    return paginate(items, page, pageSize);
  });
}

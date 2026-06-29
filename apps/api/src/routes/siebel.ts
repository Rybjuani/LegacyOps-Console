import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';

export async function registerSiebelMockRoutes(app: FastifyInstance, state: AppState) {
  app.get('/siebel/mock/metadata', async () => {
    const [businessObjects, integrationObjects, businessServices] = await Promise.all([
      state.siebel.listBusinessObjects(),
      state.siebel.listIntegrationObjects(),
      state.siebel.listBusinessServices()
    ]);
    return { businessObjects, integrationObjects, businessServices };
  });

  app.get('/siebel/mock/customers', async (req) => {
    const q = req.query as { q?: string; documentNumber?: string; email?: string; phone?: string };
    const items = await state.siebel.searchContacts(q);
    return { items };
  });

  app.get('/siebel/mock/customers/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const contact = await state.siebel.getContact(id);
    if (!contact) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    const account = await state.siebel.getAccount(contact.accountId);
    const assets = await state.siebel.listAssetsByAccount(contact.accountId);
    const orders = await state.siebel.listOrdersByAccount(contact.accountId);
    const activities = await state.siebel.listActivitiesByAccount(contact.accountId);
    return { contact, account, assets, orders, activities };
  });

  app.get('/siebel/mock/service-requests', async (req) => {
    const q = req.query as { accountId?: string; status?: string };
    const items = await state.siebel.listServiceRequests(q);
    return { items };
  });

  app.post('/siebel/mock/business-service/:name/invoke', async (req, reply) => {
    const name = (req.params as { name: string }).name;
    const body = req.body as { method?: string; args?: Record<string, unknown> };
    if (!body.method) return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'method is required' } });
    try {
      const result = await state.siebel.invoke(name, body.method, body.args ?? {});
      return { ok: true, ...result };
    } catch (e) {
      const code = (e as { code?: string }).code ?? 'UNKNOWN';
      const status = (e as { status?: number }).status ?? 502;
      return reply.status(status).send({ ok: false, error: { code, message: (e as Error).message } });
    }
  });

  app.get('/siebel/mock/health', async () => {
    return await state.siebel.health();
  });
}

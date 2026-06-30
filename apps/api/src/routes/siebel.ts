import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { withPermission } from '../rbac.js';
import { DEFAULT_ENDPOINT_MAP } from '@legacyops/siebel-bridge';

export async function registerSiebelMockRoutes(app: FastifyInstance, state: AppState) {
  // ---------- Adapter diagnostic endpoints ----------
  // These never expose credentials. They let an auditor verify that a real
  // adapter COULD be configured, without leaking secrets.
  app.get('/siebel/adapter/status', { preHandler: withPermission('integration:configure') }, async () => {
    const info = state.siebelAdapterInfo;
    const adapterName = (state.siebel as { name?: string }).name ?? 'unknown';
    return {
      mode: info.mode,
      adapterName,
      realConfigured: info.realConfigured,
      realConfigError: info.realConfigError,
      warning:
        info.mode === 'fake'
          ? 'Running against the Fake Siebel Lab. Set LEGACYOPS_SIEBEL_ADAPTER=real with a valid SIEBEL_BASE_URL to use the real adapter.'
          : undefined,
      circuitState:
        typeof (state.siebel as unknown as { getCircuitState?: () => string }).getCircuitState === 'function'
          ? (state.siebel as unknown as { getCircuitState: () => string }).getCircuitState()
          : undefined
    };
  });

  app.get('/siebel/adapter/config-schema', { preHandler: withPermission('integration:configure') }, async () => {
    // Static documentation of the config schema. No secrets.
    return {
      fields: [
        { name: 'SIEBEL_BASE_URL', required: true, description: 'Base URL of the Siebel-like REST endpoint' },
        { name: 'SIEBEL_AUTH_MODE', required: false, default: 'basic', enum: ['basic', 'session', 'oauth'] },
        { name: 'SIEBEL_USERNAME', requiredIf: 'authMode=basic|session' },
        { name: 'SIEBEL_PASSWORD', requiredIf: 'authMode=basic|session', secret: true },
        { name: 'SIEBEL_ACCESS_TOKEN', requiredIf: 'authMode=oauth', secret: true },
        { name: 'SIEBEL_TIMEOUT_MS', required: false, default: 8000, type: 'positive-int' },
        { name: 'SIEBEL_MAX_RETRIES', required: false, default: 2, type: 'non-negative-int' },
        { name: 'SIEBEL_RETRY_BACKOFF_MS', required: false, default: 200, type: 'non-negative-int' },
        { name: 'SIEBEL_RETRY_JITTER_MS', required: false, default: 80, type: 'non-negative-int' },
        { name: 'SIEBEL_CB_FAILURE_THRESHOLD', required: false, default: 5, type: 'positive-int' },
        { name: 'SIEBEL_CB_COOLDOWN_MS', required: false, default: 30000, type: 'positive-int' },
        { name: 'SIEBEL_DEFAULT_PAGE_SIZE', required: false, default: 50, type: 'positive-int' },
        { name: 'SIEBEL_USER_AGENT', required: false, default: 'LegacyOps-Console/0.2 (real-siebel-adapter)' },
        { name: 'LEGACYOPS_SIEBEL_ADAPTER', required: false, default: 'fake', enum: ['fake', 'real'] }
      ],
      currentRedactedConfig: state.siebelAdapterInfo.realConfigRedacted
    };
  });

  app.get('/siebel/adapter/endpoint-map', { preHandler: withPermission('integration:configure') }, async () => {
    const info = state.siebelAdapterInfo;
    return {
      mode: info.mode,
      endpointMap: info.realEndpointMap ?? DEFAULT_ENDPOINT_MAP,
      note: 'Default paths are CONCEPTUAL. Each customer pilot must review and override based on their actual Siebel REST configuration. See docs/REAL_SIEBEL_ADAPTER.md.'
    };
  });
  app.get('/siebel/mock/metadata', { preHandler: withPermission('integration:configure') }, async () => {
    const [businessObjects, integrationObjects, businessServices] = await Promise.all([
      state.siebel.listBusinessObjects(),
      state.siebel.listIntegrationObjects(),
      state.siebel.listBusinessServices()
    ]);
    return { businessObjects, integrationObjects, businessServices };
  });

  app.get('/siebel/mock/customers', { preHandler: withPermission('integration:configure') }, async (req) => {
    const q = req.query as { q?: string; documentNumber?: string; email?: string; phone?: string };
    const items = await state.siebel.searchContacts(q);
    return { items };
  });

  app.get('/siebel/mock/customers/:id', { preHandler: withPermission('integration:configure') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const contact = await state.siebel.getContact(id);
    if (!contact)
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    const account = await state.siebel.getAccount(contact.accountId);
    const assets = await state.siebel.listAssetsByAccount(contact.accountId);
    const orders = await state.siebel.listOrdersByAccount(contact.accountId);
    const activities = await state.siebel.listActivitiesByAccount(contact.accountId);
    return { contact, account, assets, orders, activities };
  });

  app.get('/siebel/mock/service-requests', { preHandler: withPermission('integration:configure') }, async (req) => {
    const q = req.query as { accountId?: string; status?: string };
    const items = await state.siebel.listServiceRequests(q);
    return { items };
  });

  app.post(
    '/siebel/mock/business-service/:name/invoke',
    { preHandler: withPermission('integration:configure') },
    async (req, reply) => {
      const name = (req.params as { name: string }).name;
      const body = req.body as { method?: string; args?: Record<string, unknown> };
      if (!body.method)
        return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'method is required' } });
      try {
        const result = await state.siebel.invoke(name, body.method, body.args ?? {});
        return { ok: true, ...result };
      } catch (e) {
        const code = (e as { code?: string }).code ?? 'UNKNOWN';
        const status = (e as { status?: number }).status ?? 502;
        return reply.status(status).send({ ok: false, error: { code, message: (e as Error).message } });
      }
    }
  );

  app.get('/siebel/mock/health', { preHandler: withPermission('integration:configure') }, async () => {
    return await state.siebel.health();
  });
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealSiebelAdapter, type FetchLike } from './RealSiebelAdapter.js';
import type { RealSiebelConfig } from './RealSiebelConfig.js';
import type { AdapterCallEvent } from './SiebelRestHttpClient.js';
import { SiebelRestError } from './SiebelRestErrorMapper.js';

function makeConfig(overrides: Partial<RealSiebelConfig> = {}): RealSiebelConfig {
  return {
    baseUrl: 'https://siebel.example.com',
    authMode: 'basic',
    username: 'u',
    password: 'p',
    timeoutMs: 5000,
    maxRetries: 0,
    retryBackoffMs: 0,
    retryJitterMs: 0,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerCooldownMs: 30_000,
    defaultPageSize: 25,
    userAgent: 'test-agent',
    ...overrides
  };
}

function makeResponse(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, { status, headers: { 'content-type': 'application/json' } });
}

function makeFetchReturning(
  routes: Record<string, { status: number; body: unknown }>
): FetchLike & ReturnType<typeof vi.fn> {
  return vi.fn(async (input: string | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [pathFragment, response] of Object.entries(routes)) {
      if (url.includes(pathFragment)) {
        return makeResponse(response.status, response.body);
      }
    }
    return makeResponse(404, { message: `no mock for ${url}` });
  });
}

describe('RealSiebelAdapter', () => {
  let adapter: RealSiebelAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchContacts maps raw payload to SiebelContact[]', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact': {
        status: 200,
        body: {
          items: [
            { Id: 'c1', AccountId: 'a1', FirstName: 'Ana', LastName: 'Paz', Email: 'a@b.com' },
            { Id: 'c2', AccountId: 'a2', FirstName: 'Ben', LastName: 'Rae' }
          ]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const contacts = await adapter.searchContacts({ q: 'ana' });
    expect(contacts).toHaveLength(2);
    expect(contacts[0].id).toBe('c1');
    expect(contacts[0].firstName).toBe('Ana');
    expect(contacts[1].lastName).toBe('Rae');
  });

  it('getContact returns the contact when found', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact/c1': { status: 200, body: { Id: 'c1', FirstName: 'Ana', LastName: 'Paz' } }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const c = await adapter.getContact('c1');
    expect(c).toBeDefined();
    expect(c!.id).toBe('c1');
  });

  it('getContact returns undefined on 404', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact/missing': { status: 404, body: { message: 'not found' } }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const c = await adapter.getContact('missing');
    expect(c).toBeUndefined();
  });

  it('getAccount returns the account when found', async () => {
    const fetchImpl = makeFetchReturning({
      '/Account/Account/a1': { status: 200, body: { Id: 'a1', Name: 'Acme', Status: 'Active' } }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const a = await adapter.getAccount('a1');
    expect(a).toBeDefined();
    expect(a!.name).toBe('Acme');
  });

  it('listAccounts returns multiple accounts', async () => {
    const fetchImpl = makeFetchReturning({
      '/Account/Account': {
        status: 200,
        body: {
          items: [
            { Id: 'a1', Name: 'Acme', Status: 'Active' },
            { Id: 'a2', Name: 'Globex', Status: 'Active' }
          ]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const accounts = await adapter.listAccounts({});
    expect(accounts).toHaveLength(2);
  });

  it('listServiceRequests maps SRs', async () => {
    const fetchImpl = makeFetchReturning({
      'Service Request': {
        status: 200,
        body: {
          items: [
            {
              Id: 'sr1',
              AccountId: 'a1',
              Status: 'Open',
              Priority: '1-High',
              Subject: 'Bad invoice',
              Created: '2026-01-01'
            }
          ]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const srs = await adapter.listServiceRequests({});
    expect(srs).toHaveLength(1);
    expect(srs[0].status).toBe('Open');
    expect(srs[0].priority).toBe('1-High');
  });

  it('createServiceRequest POSTs and returns the mapped SR', async () => {
    const fetchImpl = makeFetchReturning({
      'Service Request': {
        status: 200,
        body: {
          Id: 'sr_new',
          AccountId: 'a1',
          ContactId: 'c1',
          Status: 'Open',
          Priority: '2-Medium',
          Subject: 'Test',
          Created: '2026-01-01'
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const sr = await adapter.createServiceRequest({
      accountId: 'a1',
      contactId: 'c1',
      subject: 'Test',
      description: 'desc',
      category: 'billing',
      priority: '2-Medium'
    });
    expect(sr.id).toBe('sr_new');
    // Verify POST was used
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
  });

  it('invoke business service POSTs to the service path', async () => {
    const fetchImpl = makeFetchReturning({
      '/service/MyBS/GetMethod': { status: 200, body: { result: 'ok' } }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const { result, durationMs } = await adapter.invoke('MyBS', 'GetMethod', { id: 'x' });
    expect(result).toEqual({ result: 'ok' });
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it('listBusinessObjects maps metadata', async () => {
    const fetchImpl = makeFetchReturning({
      '/metadata/businessobjects': {
        status: 200,
        body: {
          items: [{ Name: 'Account', components: ['Account', 'Account Address'] }]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const bos = await adapter.listBusinessObjects();
    expect(bos).toHaveLength(1);
    expect(bos[0].name).toBe('Account');
    expect(bos[0].components).toEqual(['Account', 'Account Address']);
  });

  it('health returns up when healthcheck succeeds', async () => {
    const fetchImpl = makeFetchReturning({
      '/healthcheck': { status: 200, body: { ok: true } }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const h = await adapter.health();
    expect(h.status).toBe('up');
    expect(h.adapter).toBe('siebel-bridge');
  });

  it('health returns degraded when healthcheck fails', async () => {
    const fetchImpl = makeFetchReturning({
      '/healthcheck': { status: 500, body: {} }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const h = await adapter.health();
    expect(h.status).toBe('degraded');
  });

  it('health returns down when circuit breaker is open', async () => {
    const fetchImpl = makeFetchReturning({
      '/Account/Account': { status: 500, body: {} },
      '/healthcheck': { status: 500, body: {} }
    });
    const cfg = makeConfig({ circuitBreakerFailureThreshold: 1, maxRetries: 0 });
    adapter = new RealSiebelAdapter({ config: cfg, fetchImpl, hooks: { sleepFn: async () => {} } });
    // Trigger one failure to open the breaker (listAccounts hits /Account/Account → 500)
    await expect(adapter.listAccounts({})).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(adapter.getCircuitState()).toBe('open');
    const h = await adapter.health();
    expect(h.status).toBe('down');
    expect(h.message).toMatch(/Circuit breaker/);
  });

  it('does not leak raw payload into the returned DTO', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact': {
        status: 200,
        body: {
          items: [
            {
              Id: 'c1',
              AccountId: 'a1',
              FirstName: 'Ana',
              LastName: 'Paz',
              SomeRawSiebelField: 'should not leak',
              AnotherInternalField: 42
            }
          ]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const contacts = await adapter.searchContacts({});
    expect(JSON.stringify(contacts)).not.toContain('SomeRawSiebelField');
    expect(JSON.stringify(contacts)).not.toContain('AnotherInternalField');
  });

  it('onCall hook is invoked for each adapter call', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact': { status: 200, body: { items: [] } }
    });
    const events: AdapterCallEvent[] = [];
    adapter = new RealSiebelAdapter({
      config: makeConfig(),
      fetchImpl,
      hooks: { onCall: (e) => events.push(e) }
    });
    await adapter.searchContacts({});
    expect(events).toHaveLength(1);
    expect(events[0].method).toBe('GET');
    expect(events[0].path).toContain('/Contact/Contact');
    expect(events[0].status).toBe('success');
  });

  it('onCall hook records error events on failure', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact': { status: 500, body: {} }
    });
    const events: AdapterCallEvent[] = [];
    adapter = new RealSiebelAdapter({
      config: makeConfig({ maxRetries: 0 }),
      fetchImpl,
      hooks: { onCall: (e) => events.push(e), sleepFn: async () => {} }
    });
    await expect(adapter.searchContacts({})).rejects.toMatchObject({ name: 'SiebelRestError' });
    const errorEvents = events.filter((e) => e.status === 'error');
    expect(errorEvents.length).toBeGreaterThan(0);
    expect(errorEvents[0].httpStatus).toBe(500);
  });

  it('getAdapterMode returns "real"', () => {
    const fetchImpl = makeFetchReturning({});
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    expect(adapter.getAdapterMode()).toBe('real');
  });

  it('getEndpointMap returns the configured map', () => {
    const fetchImpl = makeFetchReturning({});
    adapter = new RealSiebelAdapter({
      config: makeConfig(),
      fetchImpl,
      endpointMap: { contactsSearch: '/custom/contacts' }
    });
    const map = adapter.getEndpointMap();
    expect(map.contactsSearch).toBe('/custom/contacts');
    // Other defaults preserved
    expect(map.contactById).toMatch(/^\/siebel/);
  });

  it('login in basic mode returns a static handle', async () => {
    const fetchImpl = makeFetchReturning({});
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const s = await adapter.login('u', 'p');
    expect(s.token).toBe('static-basic');
    expect(s.expiresAt).toBeTruthy();
  });

  it('verify recognizes the static handle in basic mode', async () => {
    const fetchImpl = makeFetchReturning({});
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const s = await adapter.login('u', 'p');
    const v = await adapter.verify(s.token);
    expect(v.valid).toBe(true);
  });

  it('verify rejects unknown token in basic mode', async () => {
    const fetchImpl = makeFetchReturning({});
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const v = await adapter.verify('not-a-real-token');
    expect(v.valid).toBe(false);
  });

  it('getBillingSummary derives from invoices', async () => {
    const fetchImpl = makeFetchReturning({
      '/Invoice': {
        status: 200,
        body: {
          items: [
            {
              Id: 'inv1',
              AccountId: 'a1',
              TotalAmount: 100,
              PaidAmount: 50,
              Currency: 'USD',
              Status: 'Overdue',
              DueDate: '2026-01-01'
            },
            {
              Id: 'inv2',
              AccountId: 'a1',
              TotalAmount: 200,
              PaidAmount: 200,
              Currency: 'USD',
              Status: 'Paid',
              DueDate: '2026-02-01'
            }
          ]
        }
      }
    });
    adapter = new RealSiebelAdapter({ config: makeConfig(), fetchImpl });
    const summary = await adapter.getBillingSummary('a1');
    expect(summary.accountId).toBe('a1');
    expect(summary.totalDue).toBe(50); // 100-50 + 200-200
    expect(summary.overdueAmount).toBe(50);
    expect(summary.currency).toBe('USD');
  });

  it('SiebelRestError is thrown on server error with maxRetries=0', async () => {
    const fetchImpl = makeFetchReturning({
      '/Contact/Contact': { status: 500, body: {} }
    });
    adapter = new RealSiebelAdapter({
      config: makeConfig({ maxRetries: 0 }),
      fetchImpl,
      hooks: { sleepFn: async () => {} }
    });
    await expect(adapter.searchContacts({})).rejects.toBeInstanceOf(SiebelRestError);
  });
});

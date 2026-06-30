import { describe, it, expect, vi } from 'vitest';
import { SiebelRestHttpClient, buildUrl, type FetchLike, type AdapterCallEvent } from './SiebelRestHttpClient.js';
import type { RealSiebelConfig } from './RealSiebelConfig.js';
import type { SiebelRestError } from './SiebelRestErrorMapper.js';

function makeConfig(overrides: Partial<RealSiebelConfig> = {}): RealSiebelConfig {
  return {
    baseUrl: 'https://siebel.example.com',
    authMode: 'basic',
    username: 'u',
    password: 'p',
    timeoutMs: 100,
    maxRetries: 2,
    retryBackoffMs: 0,
    retryJitterMs: 0,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerCooldownMs: 30_000,
    defaultPageSize: 50,
    userAgent: 'test-agent',
    ...overrides
  };
}

function makeFetchResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  });
}

describe('SiebelRestHttpClient', () => {
  it('GET parses JSON', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(200, { hello: 'world' }));
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl);
    const result = await client.get<{ hello: string }>('/path');
    expect(result).toEqual({ hello: 'world' });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const callArgs = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[0]).toBe('https://siebel.example.com/path');
    expect(callArgs[1].method).toBe('GET');
  });

  it('POST sends JSON body', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(200, { ok: true }));
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl);
    await client.post('/path', { foo: 'bar' });
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ foo: 'bar' }));
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('PUT sends JSON body', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(200, { ok: true }));
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl);
    await client.put('/path', { foo: 'bar' });
    const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('PUT');
  });

  it('DELETE without body', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(200, ''));
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl);
    const result = await client.delete('/path');
    expect(result).toBeUndefined();
  });

  it('404 maps to non-retriable SiebelRestError', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(404, { message: 'not found' }));
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl);
    await expect(client.get('/path')).rejects.toMatchObject({
      name: 'SiebelRestError',
      mapped: { category: 'not_found', retriable: false }
    });
    expect(fetchImpl).toHaveBeenCalledOnce(); // no retry
  });

  it('500 maps to retriable and retries up to maxRetries', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(500, {}));
    const client = new SiebelRestHttpClient(makeConfig({ maxRetries: 2, retryBackoffMs: 0 }), fetchImpl, {
      sleepFn: async () => {}
    });
    await expect(client.get('/path')).rejects.toMatchObject({
      name: 'SiebelRestError'
    });
    expect(fetchImpl).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it('does not retry non-retriable 404', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(404, {}));
    const client = new SiebelRestHttpClient(makeConfig({ maxRetries: 3 }), fetchImpl, {
      sleepFn: async () => {}
    });
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('timeout via AbortError is retriable', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      throw err;
    });
    const client = new SiegelRestHttpClientForTimeout(makeConfig({ maxRetries: 1, timeoutMs: 50 }), fetchImpl);
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('circuit breaker opens after failureThreshold retriable failures', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(500, {}));
    const client = new SiebelRestHttpClient(
      makeConfig({ maxRetries: 0, circuitBreakerFailureThreshold: 2, circuitBreakerCooldownMs: 10_000 }),
      fetchImpl,
      { sleepFn: async () => {} }
    );
    // First failure
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(client.getCircuitState()).toBe('closed');
    // Second failure — opens breaker
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(client.getCircuitState()).toBe('open');
    // Third call is blocked by breaker
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    // The third call should NOT have hit fetch (blocked by breaker)
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('emits onCall hook with success event', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(200, { ok: true }));
    const events: AdapterCallEvent[] = [];
    const client = new SiebelRestHttpClient(makeConfig(), fetchImpl, {
      onCall: (e) => events.push(e)
    });
    await client.get('/path');
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('success');
    expect(events[0].httpStatus).toBe(200);
    expect(events[0].method).toBe('GET');
    expect(events[0].path).toBe('/path');
  });

  it('emits onCall hook with error event on 500', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(500, {}));
    const events: AdapterCallEvent[] = [];
    const client = new SiebelRestHttpClient(makeConfig({ maxRetries: 0 }), fetchImpl, {
      onCall: (e) => events.push(e)
    });
    await expect(client.get('/path')).rejects.toMatchObject({ name: 'SiebelRestError' });
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('error');
    expect(events[0].httpStatus).toBe(500);
    expect(events[0].errorCode).toBe('SERVER_ERROR');
    expect(events[0].retriable).toBe(true);
  });

  it('credentials do not appear in error messages', async () => {
    const fetchImpl: FetchLike = vi.fn(async () => makeFetchResponse(401, {}));
    const client = new SiebelRestHttpClient(
      makeConfig({ username: 'secretUser', password: 'secretPass123' }),
      fetchImpl
    );
    try {
      await client.get('/path');
      throw new Error('should have thrown');
    } catch (e) {
      const msg = (e as Error).message + ' ' + JSON.stringify((e as SiebelRestError).mapped ?? {});
      expect(msg).not.toContain('secretUser');
      expect(msg).not.toContain('secretPass123');
    }
  });

  it('buildUrl joins base + path safely', () => {
    expect(buildUrl('https://x.com/', '/path')).toBe('https://x.com/path');
    expect(buildUrl('https://x.com', 'path')).toBe('https://x.com/path');
    expect(buildUrl('https://x.com/', '/path', { a: 1, b: 'hi' })).toBe('https://x.com/path?a=1&b=hi');
    expect(buildUrl('https://x.com', '/path', { a: undefined })).toBe('https://x.com/path');
  });
});

// Subclass to expose the protected `request` for timeout-specific test.
// (The base class already exposes get/post/put/delete which call request.)
class SiegelRestHttpClientForTimeout extends SiebelRestHttpClient {
  // no-op; the base class is sufficient.
}

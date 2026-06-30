import { describe, it, expect } from 'vitest';
import { mapHttpResponseError, mapNetworkError, SiebelRestError } from './SiebelRestErrorMapper.js';

function makeResponse(status: number, body: unknown): Response {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, { status, headers: { 'content-type': 'application/json' } });
}

describe('SiebelRestErrorMapper', () => {
  it('maps 400 to bad_request, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(400, { message: 'bad input' }));
    expect(e.category).toBe('bad_request');
    expect(e.retriable).toBe(false);
    expect(e.code).toBe('BAD_REQUEST');
  });

  it('maps 401 to auth, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(401, {}));
    expect(e.category).toBe('auth');
    expect(e.retriable).toBe(false);
  });

  it('maps 403 to permission, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(403, {}));
    expect(e.category).toBe('permission');
    expect(e.retriable).toBe(false);
  });

  it('maps 404 to not_found, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(404, { message: 'not here' }));
    expect(e.category).toBe('not_found');
    expect(e.retriable).toBe(false);
  });

  it('maps 409 to conflict, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(409, {}));
    expect(e.category).toBe('conflict');
    expect(e.retriable).toBe(false);
  });

  it('maps 429 to rate_limit, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(429, {}));
    expect(e.category).toBe('rate_limit');
    expect(e.retriable).toBe(true);
  });

  it('maps 500 to server, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(500, {}));
    expect(e.category).toBe('server');
    expect(e.retriable).toBe(true);
  });

  it('maps 503 to server, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(503, {}));
    expect(e.category).toBe('server');
    expect(e.retriable).toBe(true);
  });

  it('maps 504 to server, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(504, {}));
    expect(e.category).toBe('server');
    expect(e.retriable).toBe(true);
  });

  it('maps body with SBL-EAI-* raw code to timeout, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(504, { errors: [{ code: 'SBL-EAI-001' }] }));
    expect(e.rawCode).toBe('SBL-EAI-001');
    expect(e.category).toBe('timeout');
    expect(e.retriable).toBe(true);
  });

  it('maps body with SBL-AUTH-001 raw code to auth_expired, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(401, { ErrorMessage: 'SBL-AUTH-001: session expired' }));
    expect(e.rawCode).toBe('SBL-AUTH-001');
    expect(e.category).toBe('auth');
    expect(e.retriable).toBe(false);
  });

  it('maps body with SBL-AUTH-002 raw code to permission_denied, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(403, { code: 'SBL-AUTH-002' }));
    expect(e.rawCode).toBe('SBL-AUTH-002');
    expect(e.category).toBe('permission');
    expect(e.retriable).toBe(false);
  });

  it('maps body with SBL-DAT-* raw code to conflict, non-retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(409, { code: 'SBL-DAT-001' }));
    expect(e.rawCode).toBe('SBL-DAT-001');
    expect(e.category).toBe('conflict');
    expect(e.retriable).toBe(false);
  });

  it('maps body with SBL-DBC-* raw code to server, retriable', async () => {
    const e = await mapHttpResponseError(makeResponse(500, { code: 'SBL-DBC-001' }));
    expect(e.rawCode).toBe('SBL-DBC-001');
    expect(e.category).toBe('server');
    expect(e.retriable).toBe(true);
  });

  it('maps network AbortError to timeout, retriable', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    const e = mapNetworkError(err);
    expect(e.category).toBe('timeout');
    expect(e.retriable).toBe(true);
  });

  it('maps generic network error to network, retriable', () => {
    const e = mapNetworkError(new Error('ECONNREFUSED'));
    expect(e.category).toBe('network');
    expect(e.retriable).toBe(true);
  });

  it('SiebelRestError carries the mapped shape', () => {
    const mapped = {
      code: 'X',
      category: 'server' as const,
      message: 'boom',
      httpStatus: 500,
      retriable: true
    };
    const e = new SiebelRestError(mapped);
    expect(e.mapped).toBe(mapped);
    expect(e.message).toBe('boom');
    expect(e.name).toBe('SiebelRestError');
  });
});

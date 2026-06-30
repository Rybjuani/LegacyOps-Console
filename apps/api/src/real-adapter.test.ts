/**
 * HTTP smoke tests for the Real Siebel adapter diagnostic endpoints.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';

const ADMIN_HEADER = { 'x-legacyops-role': 'admin' };
const OPERATOR_HEADER = { 'x-legacyops-role': 'operator' };

describe('LegacyOps API — real Siebel adapter diagnostic endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const built = await buildServer();
    app = built.app;
  });

  it('GET /siebel/adapter/status returns fake mode by default', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/status',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.mode).toBe('fake');
    expect(body.realConfigured).toBe(false);
    expect(body.warning).toMatch(/Fake Siebel Lab/);
  });

  it('GET /siebel/adapter/status does not expose credentials', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/status',
      headers: ADMIN_HEADER
    });
    const text = res.body;
    expect(text).not.toMatch(/password/i);
    expect(text).not.toMatch(/token/i);
  });

  it('GET /siebel/adapter/config-schema lists all config fields', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/config-schema',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fields.length).toBeGreaterThan(10);
    const fieldNames = body.fields.map((f: { name: string }) => f.name);
    expect(fieldNames).toContain('SIEBEL_BASE_URL');
    expect(fieldNames).toContain('SIEBEL_AUTH_MODE');
    expect(fieldNames).toContain('LEGACYOPS_SIEBEL_ADAPTER');
    // Secret fields must be marked
    const passwordField = body.fields.find((f: { name: string }) => f.name === 'SIEBEL_PASSWORD');
    expect(passwordField.secret).toBe(true);
  });

  it('GET /siebel/adapter/config-schema does not expose credentials', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/config-schema',
      headers: ADMIN_HEADER
    });
    const text = res.body;
    // The redacted config (when real mode is not configured) is null/undefined.
    // Even if it were present, redactConfig only exposes has* booleans.
    expect(text).not.toMatch(/"password":\s*"[^"]+"/);
    expect(text).not.toMatch(/"accessToken":\s*"[^"]+"/);
  });

  it('GET /siebel/adapter/endpoint-map returns the default conceptual map', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/endpoint-map',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.mode).toBe('fake');
    expect(body.endpointMap).toBeDefined();
    expect(body.endpointMap.contactsSearch).toMatch(/^\/siebel/);
    expect(body.endpointMap.businessServiceInvoke).toContain('{businessService}');
    expect(body.note).toMatch(/CONCEPTUAL/);
  });

  it('operator cannot access /siebel/adapter/status (integration:configure denied)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/status',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  it('operator cannot access /siebel/adapter/config-schema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/config-schema',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  it('operator cannot access /siebel/adapter/endpoint-map', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/adapter/endpoint-map',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });
});

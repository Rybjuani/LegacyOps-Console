/**
 * HTTP smoke tests for the LegacyOps API.
 *
 * Uses Fastify `inject` so no real port is opened. The same `buildServer()`
 * used in production is exercised end-to-end, including RBAC enforcement.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';

const ADMIN_HEADER = { 'x-legacyops-role': 'admin' };
const OPERATOR_HEADER = { 'x-legacyops-role': 'operator' };

describe('LegacyOps API — smoke tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const built = await buildServer();
    app = built.app;
  });

  // ---------- Health ----------
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('legacyops-api');
  });

  // ---------- Customers ----------
  it('GET /customers with admin role returns paginated list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers?page=1&pageSize=5',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.total).toBeGreaterThan(0);
    expect(body.page).toBe(1);
  });

  it('GET /customers/:id returns a full customer 360', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const first = list.json().items[0];

    const res = await app.inject({
      method: 'GET',
      url: `/customers/${first.id}`,
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.customer.id).toBe(first.id);
    expect(body.account).toBeDefined();
    expect(Array.isArray(body.contactMethods)).toBe(true);
  });

  it('GET /customers/:id/billing returns invoices+payments+debts', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const first = list.json().items[0];

    const res = await app.inject({
      method: 'GET',
      url: `/customers/${first.id}/billing`,
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('invoices');
    expect(body).toHaveProperty('payments');
    expect(body).toHaveProperty('debts');
    expect(body).toHaveProperty('totalDue');
  });

  // ---------- Siebel Bridge Lab ----------
  it('GET /siebel/mock/metadata returns business objects, integration objects, business services', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/mock/metadata',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.businessObjects.length).toBeGreaterThan(0);
    expect(body.integrationObjects.length).toBeGreaterThan(0);
    expect(body.businessServices.length).toBeGreaterThan(0);
  });

  it('POST /siebel/mock/business-service/:name/invoke works with allowed role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/siebel/mock/business-service/LegacyOps%20Customer%20BS/invoke',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ method: 'GetCustomer', args: { id: 'x' } })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.result).toBeDefined();
    expect(body.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ---------- Migration ----------
  it('GET /migration/source-of-truth returns registry, source systems, module statuses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.sourceSystems.length).toBeGreaterThan(0);
    expect(body.entries.length).toBeGreaterThan(0);
    expect(body.moduleStatuses.length).toBeGreaterThan(0);
    expect(typeof body.idMappings).toBe('number');
  });

  it('POST /migration/dry-run returns a structured report', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/migration/dry-run',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.planId).toBeTruthy();
    expect(typeof body.totalRecords).toBe('number');
    expect(Array.isArray(body.conflicts)).toBe(true);
  });

  // ---------- ROI ----------
  it('GET /roi/demo returns assumptions and computed metrics', async () => {
    const res = await app.inject({ method: 'GET', url: '/roi/demo' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.assumptions).toBeDefined();
    expect(body.assumptions.before).toBeDefined();
    expect(body.assumptions.after).toBeDefined();
    expect(body.computed).toBeDefined();
    expect(body.computed.monthlySavingsUsd).toBeGreaterThan(0);
  });

  // ---------- RBAC enforcement ----------
  it('auditor cannot run migration dry-run (migration:run denied)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/migration/dry-run',
      headers: { 'x-legacyops-role': 'auditor', 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toMatch(/migration:run/);
  });

  it('auditor can read audit-events', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/audit-events',
      headers: { 'x-legacyops-role': 'auditor' }
    });
    expect(res.statusCode).toBe(200);
  });

  it('operator cannot invoke siebel business services (integration:configure denied)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/siebel/mock/metadata',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  it('operator cannot run migration dry-run (migration:run denied)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/migration/dry-run',
      headers: { ...OPERATOR_HEADER, 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(res.statusCode).toBe(403);
  });

  it('operator can read customers (customer:read allowed)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(200);
  });

  it('operator cannot read migration source-of-truth (integration:configure denied)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  it('admin can read migration source-of-truth (integration:configure allowed)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
  });

  // ---------- Cases create ----------
  it('admin can create a case', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const customerId = list.json().items[0].id;

    const res = await app.inject({
      method: 'POST',
      url: '/cases',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({
        customerId,
        subject: 'Smoke test case',
        category: 'billing_claim',
        description: 'Created by smoke test'
      })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBeTruthy();
    expect(body.data.subject).toBe('Smoke test case');
  });

  // ---------- Workflow start + complete ----------
  it('admin can start and step through a workflow', async () => {
    const customerList = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const customerId = customerList.json().items[0].id;

    const start = await app.inject({
      method: 'POST',
      url: '/workflows/wf_payment_promise/start',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ customerId })
    });
    expect(start.statusCode).toBe(200);
    const run = start.json().data;
    expect(run.status).toBe('active');

    const stepRes = await app.inject({
      method: 'POST',
      url: `/workflow-runs/${run.id}/steps/review_debt/complete`,
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ capturedFields: { debtId: 'debt_1', totalAmount: 100 } })
    });
    expect(stepRes.statusCode).toBe(200);
    const updated = stepRes.json().data;
    expect(updated.steps[0].status).toBe('completed');
    expect(updated.steps[1].status).toBe('active');
  });

  // ---------- Legacy observability ----------
  it('admin can read legacy health and metrics', async () => {
    const h = await app.inject({
      method: 'GET',
      url: '/legacy/health',
      headers: ADMIN_HEADER
    });
    expect(h.statusCode).toBe(200);
    const body = h.json();
    expect(['healthy', 'degraded', 'down', 'unknown']).toContain(body.overall);

    const m = await app.inject({
      method: 'GET',
      url: '/legacy/metrics',
      headers: ADMIN_HEADER
    });
    expect(m.statusCode).toBe(200);
    expect(m.json()).toHaveProperty('operational');
    expect(m.json()).toHaveProperty('legacy');
  });

  // ---------- Public research notes ----------
  it('GET /legacy/research-notes is public (no role required)', async () => {
    const res = await app.inject({ method: 'GET', url: '/legacy/research-notes' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary).toBeTruthy();
    expect(Array.isArray(body.links)).toBe(true);
    expect(body.links.length).toBeGreaterThan(0);
  });

  // ---------- RBAC edge cases ----------
  it('missing role header defaults to operator and can read customers', async () => {
    const res = await app.inject({ method: 'GET', url: '/customers?pageSize=1' });
    expect(res.statusCode).toBe(200);
  });

  it('missing role header cannot access admin-only migration endpoints', async () => {
    const res = await app.inject({ method: 'GET', url: '/migration/source-of-truth' });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('unknown role falls back to default operator (no privilege escalation)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: { 'x-legacyops-role': 'super_root_admin' }
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('invalid role cannot access admin endpoints even with weird casing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: { 'x-legacyops-role': 'ADMIN' }
    });
    expect(res.statusCode).toBe(403);
  });

  it('legacy observability endpoints require integration:configure for operator', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/health',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  it('legacy observability endpoints accessible to admin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/health',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
  });

  // ---------- Audit log permission-denied event ----------
  it('permission-denied request records an audit event', async () => {
    // Trigger a denial on a known endpoint with a known permission
    await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: OPERATOR_HEADER
    });
    // Read audit events as auditor
    const auditRes = await app.inject({
      method: 'GET',
      url: '/audit-events?type=permission.denied',
      headers: { 'x-legacyops-role': 'auditor' }
    });
    expect(auditRes.statusCode).toBe(200);
    const body = auditRes.json();
    expect(body.total).toBeGreaterThan(0);
    // Find the most recent permission.denied event for this specific resource
    const events = body.items.filter(
      (e: { type: string; metadata: { permission: string; resource?: string } }) =>
        e.type === 'permission.denied' &&
        e.metadata?.permission === 'integration:configure' &&
        typeof e.metadata?.resource === 'string' &&
        e.metadata.resource.includes('/migration/source-of-truth')
    );
    expect(events.length).toBeGreaterThan(0);
    const event = events[events.length - 1];
    expect(event.metadata.permission).toBe('integration:configure');
    expect(event.metadata.resource).toMatch(/migration\/source-of-truth/);
  });

  // ---------- Error envelope consistency ----------
  it('403 responses follow the { ok: false, error: { code, message } } envelope', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/source-of-truth',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
    const body = res.json();
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: expect.stringMatching(/integration:configure/)
      }
    });
  });

  it('404 responses follow the { ok: false, error: { code, message } } envelope', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/customers/does_not_exist',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.stringMatching(/Customer/)
      }
    });
  });

  it('400 responses follow the { ok: false, error: { code, message } } envelope', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cases',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({}) // missing required fields
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toMatch(/customerId/i);
  });
});

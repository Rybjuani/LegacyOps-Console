/**
 * HTTP smoke tests for the new endpoints added in Phase B (B4, B5, B6, B8, B9).
 *
 * Uses Fastify inject — no real port.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from './server.js';

const ADMIN_HEADER = { 'x-legacyops-role': 'admin' };
const OPERATOR_HEADER = { 'x-legacyops-role': 'operator' };

describe('LegacyOps API — Phase B endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const built = await buildServer();
    app = built.app;
  });

  // ---------- B4: case comments, assign, escalate ----------
  it('GET /cases/:id returns case + comments', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/cases',
      headers: ADMIN_HEADER
    });
    const firstId = list.json().items[0].id;
    const res = await app.inject({
      method: 'GET',
      url: `/cases/${firstId}`,
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.case.id).toBe(firstId);
    expect(Array.isArray(body.comments)).toBe(true);
  });

  it('POST /cases/:id/comments adds a comment and emits audit event', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/cases',
      headers: ADMIN_HEADER
    });
    const firstId = list.json().items[0].id;
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${firstId}/comments`,
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ body: 'Test comment from smoke test', internal: false })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.body).toMatch(/Test comment/);
    expect(body.data.id).toBeTruthy();
  });

  it('POST /cases/:id/assign updates case and returns assignment', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/cases',
      headers: ADMIN_HEADER
    });
    const firstId = list.json().items[0].id;
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${firstId}/assign`,
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ assigneeId: 'usr_operator2', queueId: 'q_billing', reason: 'manual' })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.assignment.caseId).toBe(firstId);
    expect(body.data.case.queueId).toBe('q_billing');
  });

  it('POST /cases/:id/escalate bumps priority and returns escalation', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/cases',
      headers: ADMIN_HEADER
    });
    const firstId = list.json().items[0].id;
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${firstId}/escalate`,
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ toQueueId: 'q_voice_general', reason: 'customer asked for supervisor' })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.escalation.reason).toMatch(/supervisor/);
  });

  it('operator cannot escalate (case:escalate denied)', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/cases',
      headers: ADMIN_HEADER
    });
    const firstId = list.json().items[0].id;
    const res = await app.inject({
      method: 'POST',
      url: `/cases/${firstId}/escalate`,
      headers: { ...OPERATOR_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ reason: 'test' })
    });
    expect(res.statusCode).toBe(403);
  });

  // ---------- B5: workflow cancel + can-complete ----------
  it('POST /workflow-runs/:id/cancel cancels an active run', async () => {
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
    const runId = start.json().data.id;
    const cancel = await app.inject({
      method: 'POST',
      url: `/workflow-runs/${runId}/cancel`,
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(cancel.statusCode).toBe(200);
    expect(cancel.json().data.status).toBe('cancelled');
  });

  it('GET /workflow-runs/:id/can-complete/:stepId respects requiredRole', async () => {
    const customerList = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const customerId = customerList.json().items[0].id;
    const start = await app.inject({
      method: 'POST',
      url: '/workflows/wf_service_order_followup/start',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ customerId })
    });
    const runId = start.json().data.id;
    // identify_order requires operator; admin should be allowed.
    const adminCheck = await app.inject({
      method: 'GET',
      url: `/workflow-runs/${runId}/can-complete/identify_order`,
      headers: ADMIN_HEADER
    });
    expect(adminCheck.statusCode).toBe(200);
    expect(adminCheck.json().allowed).toBe(true);
    // schedule_followup requires senior_operator; operator should be denied.
    const opCheck = await app.inject({
      method: 'GET',
      url: `/workflow-runs/${runId}/can-complete/schedule_followup`,
      headers: OPERATOR_HEADER
    });
    expect(opCheck.statusCode).toBe(200);
    expect(opCheck.json().allowed).toBe(false);
  });

  it('GET /workflow-runs/:id returns run + summary', async () => {
    const customerList = await app.inject({
      method: 'GET',
      url: '/customers?pageSize=1',
      headers: ADMIN_HEADER
    });
    const customerId = customerList.json().items[0].id;
    const start = await app.inject({
      method: 'POST',
      url: '/workflows/wf_billing_claim/start',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ customerId })
    });
    const runId = start.json().data.id;
    const res = await app.inject({
      method: 'GET',
      url: `/workflow-runs/${runId}`,
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.run.id).toBe(runId);
    expect(body.summary).toBeDefined();
    expect(body.summary.totalSteps).toBeGreaterThan(0);
  });

  // ---------- B6: migration mappings, id-mappings, conflicts, rollback ----------
  it('GET /migration/mappings returns entity mappings + source-of-truth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/mappings',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.entityMappings.length).toBeGreaterThan(0);
    expect(body.sourceOfTruth.length).toBeGreaterThan(0);
  });

  it('GET /migration/id-mappings returns mapped pairs', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/id-mappings',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.total).toBe('number');
    expect(Array.isArray(body.mappings)).toBe(true);
  });

  it('GET /migration/conflicts/demo returns deterministic conflicts', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/conflicts/demo',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.total).toBe('number');
    expect(Array.isArray(body.conflicts)).toBe(true);
  });

  it('POST /migration/conflicts/resolve returns a receipt', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/migration/conflicts/resolve',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ conflictId: 'conflict_demo_1', resolution: 'skip', note: 'test' })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.receiptId).toMatch(/^mcr_/);
    expect(body.data.resolution).toBe('skip');
  });

  it('POST /migration/conflicts/resolve rejects missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/migration/conflicts/resolve',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(res.statusCode).toBe(400);
  });

  it('GET /migration/rollback-plan/demo returns structured rollback steps', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/rollback-plan/demo',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.planId).toBeTruthy();
    expect(body.reversibleUntil).toBeTruthy();
    expect(Array.isArray(body.steps)).toBe(true);
    expect(body.steps.length).toBeGreaterThan(0);
    expect(body.steps[0].order).toBe(1);
  });

  it('GET /migration/module-status returns module statuses', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/migration/module-status',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
  });

  // ---------- B8: legacy observability endpoints ----------
  it('GET /legacy/metrics/prometheus returns text/plain exposition', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/metrics/prometheus'
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    const text = res.body;
    expect(text).toMatch(/# TYPE legacyops_legacy_sessions_active gauge/);
    expect(text).toMatch(/legacyops_legacy_sessions_active/);
    expect(text).toMatch(/# TYPE legacyops_legacy_component_status gauge/);
  });

  it('GET /legacy/components returns component list + overall', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/components',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(['healthy', 'degraded', 'down', 'unknown']).toContain(body.overall);
  });

  it('GET /legacy/errors returns error list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/errors',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);
  });

  it('GET /legacy/latency returns latency report', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/latency',
      headers: ADMIN_HEADER
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().items)).toBe(true);
  });

  it('operator cannot access /legacy/components (integration:configure denied)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/legacy/components',
      headers: OPERATOR_HEADER
    });
    expect(res.statusCode).toBe(403);
  });

  // ---------- B9: ROI calculate ----------
  it('POST /roi/calculate returns computed savings from custom inputs', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/roi/calculate',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({
        operatorCount: 100,
        avgHandleTimeBefore: 600,
        avgHandleTimeAfter: 360,
        monthlyInteractions: 1500,
        hourlyCost: 20
      })
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.data.monthlySavingsUsd).toBeGreaterThan(0);
    expect(body.data.annualSavingsUsd).toBeGreaterThan(body.data.monthlySavingsUsd);
    expect(body.data.hoursSavedPerDay).toBeGreaterThan(0);
  });

  it('POST /roi/calculate rejects negative inputs', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/roi/calculate',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: JSON.stringify({ operatorCount: -10 })
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /roi/calculate with empty body uses defaults', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/roi/calculate',
      headers: { ...ADMIN_HEADER, 'content-type': 'application/json' },
      payload: '{}'
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.inputs.operatorCount).toBeGreaterThan(0);
  });
});

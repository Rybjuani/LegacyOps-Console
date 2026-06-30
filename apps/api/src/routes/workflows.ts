import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import {
  cancelWorkflowRun,
  completeWorkflowStep,
  findDemoWorkflow,
  listDemoWorkflows,
  startWorkflow,
  summarizeWorkflowRun,
  canCompleteStep
} from '@legacyops/workflows';
import { AuditEvents } from '@legacyops/audit';
import type { WorkflowRun } from '@legacyops/domain';
import { id as makeId } from '@legacyops/shared';
import { withPermission } from '../rbac.js';

export async function registerWorkflowRoutes(app: FastifyInstance, state: AppState) {
  app.get('/workflows', { preHandler: withPermission('customer:read') }, async () => {
    return { items: listDemoWorkflows() };
  });

  app.get('/workflows/:id', { preHandler: withPermission('customer:read') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const wf = findDemoWorkflow(id);
    if (!wf) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    return { workflow: wf };
  });

  app.post('/workflows/:id/start', { preHandler: withPermission('workflow:run') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { customerId?: string; agentId?: string; caseId?: string; actorRole?: string };
    const wf = findDemoWorkflow(id);
    if (!wf) return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow not found' } });
    if (!body.customerId)
      return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: 'customerId is required' } });
    const run = startWorkflow({
      workflow: wf,
      customerId: body.customerId as never,
      agentId: (body.agentId ?? 'usr_operator1') as never,
      caseId: body.caseId as never
    });
    state.dataset.workflowRuns.push(run);
    state.auditLog.append(
      AuditEvents.workflowStarted(
        (body.agentId ?? 'usr_operator1') as never,
        body.actorRole ?? 'operator',
        run.id,
        wf.id,
        body.customerId
      )
    );
    return { ok: true, data: run };
  });

  app.post(
    '/workflow-runs/:id/steps/:stepId/complete',
    { preHandler: withPermission('workflow:run') },
    async (req, reply) => {
      const { id, stepId } = req.params as { id: string; stepId: string };
      const body = req.body as { capturedFields?: Record<string, unknown>; agentId?: string; actorRole?: string };
      const run = state.dataset.workflowRuns.find((r) => r.id === id);
      if (!run)
        return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow run not found' } });
      const wf = findDemoWorkflow(run.workflowId);
      if (!wf)
        return reply
          .status(500)
          .send({ ok: false, error: { code: 'INTERNAL', message: 'Workflow definition missing' } });
      const updated = completeWorkflowStep(run, wf, stepId, body.capturedFields ?? {});
      const idx = state.dataset.workflowRuns.findIndex((r) => r.id === id);
      state.dataset.workflowRuns[idx] = updated;
      state.auditLog.append(
        AuditEvents.workflowStepCompleted(
          (body.agentId ?? 'usr_operator1') as never,
          body.actorRole ?? 'operator',
          updated.id,
          stepId
        )
      );
      return { ok: true, data: updated };
    }
  );

  app.get('/workflow-runs', { preHandler: withPermission('customer:read') }, async () => {
    return { items: state.dataset.workflowRuns };
  });

  app.get('/workflow-runs/:id', { preHandler: withPermission('customer:read') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const run = state.dataset.workflowRuns.find((r) => r.id === id);
    if (!run)
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow run not found' } });
    const wf = findDemoWorkflow(run.workflowId);
    return { run, summary: summarizeWorkflowRun(run, wf) };
  });

  // ---------- Cancel workflow run (B5) ----------
  app.post('/workflow-runs/:id/cancel', { preHandler: withPermission('workflow:run') }, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = req.body as { agentId?: string; actorRole?: string; reason?: string } | null;
    const role = (req as unknown as { role: string }).role;
    const actorId = (req as unknown as { actorId: string }).actorId;
    const run = state.dataset.workflowRuns.find((r) => r.id === id);
    if (!run)
      return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow run not found' } });
    try {
      const cancelled = cancelWorkflowRun(run);
      const idx = state.dataset.workflowRuns.findIndex((r) => r.id === id);
      state.dataset.workflowRuns[idx] = cancelled;
      state.auditLog.append(
        AuditEvents.workflowCancelled(
          (body?.agentId ?? actorId ?? 'usr_operator1') as never,
          body?.actorRole ?? role,
          cancelled.id,
          body?.reason
        )
      );
      return { ok: true, data: cancelled };
    } catch (e) {
      return reply.status(400).send({ ok: false, error: { code: 'BAD_REQUEST', message: (e as Error).message } });
    }
  });

  // ---------- Step role check (B5) ----------
  app.get(
    '/workflow-runs/:id/can-complete/:stepId',
    { preHandler: withPermission('workflow:run') },
    async (req, reply) => {
      const { id, stepId } = req.params as { id: string; stepId: string };
      const role = (req as unknown as { role: string }).role as never;
      const run = state.dataset.workflowRuns.find((r) => r.id === id);
      if (!run)
        return reply.status(404).send({ ok: false, error: { code: 'NOT_FOUND', message: 'Workflow run not found' } });
      const wf = findDemoWorkflow(run.workflowId);
      if (!wf)
        return reply
          .status(500)
          .send({ ok: false, error: { code: 'INTERNAL', message: 'Workflow definition missing' } });
      const allowed = canCompleteStep(wf, stepId, role);
      return { allowed, stepId, role };
    }
  );
}

// Helper to create a synthetic run (for demo seeding)
export function seedWorkflowRun(
  state: AppState,
  workflowId: string,
  customerId: string,
  agentId: string
): WorkflowRun | undefined {
  const wf = findDemoWorkflow(workflowId);
  if (!wf) return undefined;
  const run = startWorkflow({ workflow: wf, customerId: customerId as never, agentId: agentId as never });
  run.id = makeId('wfr') as WorkflowRun['id'];
  state.dataset.workflowRuns.push(run);
  return run;
}

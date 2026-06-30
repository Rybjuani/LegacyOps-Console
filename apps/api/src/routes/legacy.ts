import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';
import { withPermission } from '../rbac.js';

export async function registerLegacyRoutes(app: FastifyInstance, state: AppState) {
  app.get('/legacy/research-notes', async () => {
    return {
      summary:
        'Public Siebel ecosystem audit. Confirms there is no open-source platform that combines a complete CRM core, a modern operation layer, a Siebel-like bridge, observability and a progressive migration engine.',
      links: [
        {
          url: 'https://github.com/topics/siebel',
          role: 'Topic aggregation — small set of repos, mostly utilities.',
          gap: 'No end-to-end modernization platform.'
        },
        {
          url: 'https://github.com/topics/oracle-siebel',
          role: 'Topic aggregation — exporters and Open UI samples.',
          gap: 'Tooling only; no CRM replacement story.'
        },
        {
          url: 'https://github.com/OracleSiebel/ConfiguringSiebel',
          role: 'Official Oracle samples for Open UI extensions.',
          gap: 'Vendor examples; not an integration platform.'
        },
        {
          url: 'https://github.com/OracleSiebel/ConfiguringSiebel/tree/master/ExampleCode/Open%20UI',
          role: 'Open UI extension examples.',
          gap: 'Browser-side customisation; no server-side bridge.'
        },
        {
          url: 'https://github.com/OracleSiebel/ConfiguringSiebel/blob/master/ExampleCode/Open%20UI/Nexus%20Bridge/readme.md',
          role: 'Nexus Bridge — UI bridge concept.',
          gap: 'Conceptual; not a complete CRM modernization platform.'
        },
        {
          url: 'https://github.com/svict4/siebel-openui-cookbook',
          role: 'Community Open UI recipes.',
          gap: 'Recipes only; no architecture.'
        },
        {
          url: 'https://github.com/barkadron/siebel_exporter',
          role: 'Prometheus exporter for Siebel server metrics.',
          gap: 'Metrics only; no CRM or migration.'
        },
        {
          url: 'https://docs.oracle.com/cd/F26413_09/books/RestAPI/overview-of-using-the-siebel-rest-api.html',
          role: 'Official Siebel REST API overview.',
          gap: 'Reference docs; no migration engine.'
        },
        {
          url: 'https://docs.oracle.com/en/applications/siebel/siebel-crm/26.3/szapi/index.html',
          role: 'Siebel REST API 26.3 reference.',
          gap: 'API reference; no operational layer.'
        }
      ],
      lessons: [
        'Open UI extenders and exporters exist; nobody ships a complete CRM modernization stack.',
        'Siebel REST APIs are documented — adapters are feasible without proprietary schemas.',
        'A serious platform needs: anti-corruption layer, source-of-truth registry, migration engine and observability.',
        'Legal posture: do not copy Siebel schemas; use conceptual Siebel-like types and field mappings.'
      ],
      decision:
        'LegacyOps ships its own CRM core, a Siebel-like bridge with synthetic backend, an ACL, a migration engine and legacy observability. No proprietary Siebel artifacts are reproduced.'
    };
  });

  app.get('/legacy/health', { preHandler: withPermission('integration:configure') }, async () => {
    return await state.siebelMetrics.checkAll();
  });

  app.get('/legacy/metrics', { preHandler: withPermission('integration:configure') }, async () => {
    const snap = state.metrics.snapshot();
    const siebelSnap = state.siebelMetrics.snapshot(state.metrics);
    return { operational: snap, legacy: siebelSnap, activeSessions: state.siebelMetrics };
  });

  // ---------- B8: Prometheus-like text endpoint ----------
  // Returns metrics in Prometheus text exposition format. Useful for
  // scraping with prometheus / grafana agent. NOT protected by RBAC
  // because Prometheus scrapers typically do not send role headers; in a
  // real deployment this endpoint would be behind an internal-only ingress.
  app.get('/legacy/metrics/prometheus', async (_req, reply) => {
    const siebelSnap = state.siebelMetrics.snapshot(state.metrics);
    const opSnap = state.metrics.snapshot();
    const lines: string[] = [];

    lines.push('# HELP legacyops_legacy_sessions_active Active sessions in the Fake Siebel Lab.');
    lines.push('# TYPE legacyops_legacy_sessions_active gauge');
    lines.push(
      `legacyops_legacy_sessions_active ${siebelSnap.find((m) => m.name === 'siebel_sessions_active')?.value ?? 0}`
    );

    lines.push('# HELP legacyops_legacy_queue_depth Queue depth observed in the Fake Siebel Lab.');
    lines.push('# TYPE legacyops_legacy_queue_depth gauge');
    lines.push(`legacyops_legacy_queue_depth ${siebelSnap.find((m) => m.name === 'siebel_queue_depth')?.value ?? 0}`);

    lines.push('# HELP legacyops_legacy_availability Availability ratio of the legacy system (0..1).');
    lines.push('# TYPE legacyops_legacy_availability gauge');
    lines.push(`legacyops_legacy_availability ${siebelSnap.find((m) => m.name === 'siebel_availability')?.value ?? 0}`);

    lines.push('# HELP legacyops_legacy_failed_calls_total Total failed legacy adapter calls.');
    lines.push('# TYPE legacyops_legacy_failed_calls_total counter');
    lines.push(
      `legacyops_legacy_failed_calls_total ${siebelSnap.find((m) => m.name === 'siebel_failed_calls_total')?.value ?? 0}`
    );

    lines.push('# HELP legacyops_adapter_latency_ms Adapter latency percentiles in milliseconds.');
    lines.push('# TYPE legacyops_adapter_latency_ms histogram');
    for (const lat of opSnap.latencies) {
      lines.push(
        `legacyops_adapter_latency_ms{adapter="${lat.adapter}",operation="${lat.operation}",quantile="0.5"} ${lat.p50Ms}`
      );
      lines.push(
        `legacyops_adapter_latency_ms{adapter="${lat.adapter}",operation="${lat.operation}",quantile="0.95"} ${lat.p95Ms}`
      );
      lines.push(
        `legacyops_adapter_latency_ms{adapter="${lat.adapter}",operation="${lat.operation}",quantile="0.99"} ${lat.p99Ms}`
      );
    }

    lines.push('# HELP legacyops_legacy_component_status Component health (1=healthy, 0=degraded/down).');
    lines.push('# TYPE legacyops_legacy_component_status gauge');
    const health = await state.siebelMetrics.checkAll();
    for (const c of health.components) {
      const value = c.status === 'healthy' ? 1 : 0;
      lines.push(`legacyops_legacy_component_status{component="${c.name}"} ${value}`);
    }

    lines.push('# HELP legacyops_migration_conflict_count Total migration conflicts detected.');
    lines.push('# TYPE legacyops_migration_conflict_count gauge');
    lines.push(`legacyops_migration_conflict_count ${state.metrics.errorsList().length}`);

    lines.push('# HELP legacyops_business_service_invocation_count Total business service invocations observed.');
    lines.push('# TYPE legacyops_business_service_invocation_count counter');
    lines.push(`legacyops_business_service_invocation_count ${opSnap.metrics.reduce((s, m) => s + m.value, 0)}`);

    reply.type('text/plain; version=0.0.4; charset=utf-8').send(lines.join('\n') + '\n');
  });

  app.get('/legacy/components', { preHandler: withPermission('integration:configure') }, async () => {
    const health = await state.siebelMetrics.checkAll();
    return { items: health.components, overall: health.overall };
  });

  app.get('/legacy/errors', { preHandler: withPermission('integration:configure') }, async () => {
    return { items: state.metrics.errorsList() };
  });

  app.get('/legacy/latency', { preHandler: withPermission('integration:configure') }, async () => {
    return { items: state.metrics.latencyReport() };
  });
}

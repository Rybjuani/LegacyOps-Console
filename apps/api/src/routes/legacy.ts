import type { FastifyInstance } from 'fastify';
import type { AppState } from '../state.js';

export async function registerLegacyRoutes(app: FastifyInstance, state: AppState) {
  app.get('/legacy/research-notes', async () => {
    return {
      summary:
        'Public Siebel ecosystem audit. Confirms there is no open-source platform that combines a complete CRM core, a modern operation layer, a Siebel-like bridge, observability and a progressive migration engine.',
      links: [
        { url: 'https://github.com/topics/siebel', role: 'Topic aggregation — small set of repos, mostly utilities.', gap: 'No end-to-end modernization platform.' },
        { url: 'https://github.com/topics/oracle-siebel', role: 'Topic aggregation — exporters and Open UI samples.', gap: 'Tooling only; no CRM replacement story.' },
        { url: 'https://github.com/OracleSiebel/ConfiguringSiebel', role: 'Official Oracle samples for Open UI extensions.', gap: 'Vendor examples; not an integration platform.' },
        { url: 'https://github.com/OracleSiebel/ConfiguringSiebel/tree/master/ExampleCode/Open%20UI', role: 'Open UI extension examples.', gap: 'Browser-side customisation; no server-side bridge.' },
        { url: 'https://github.com/OracleSiebel/ConfiguringSiebel/blob/master/ExampleCode/Open%20UI/Nexus%20Bridge/readme.md', role: 'Nexus Bridge — UI bridge concept.', gap: 'Conceptual; not a complete CRM modernization platform.' },
        { url: 'https://github.com/svict4/siebel-openui-cookbook', role: 'Community Open UI recipes.', gap: 'Recipes only; no architecture.' },
        { url: 'https://github.com/barkadron/siebel_exporter', role: 'Prometheus exporter for Siebel server metrics.', gap: 'Metrics only; no CRM or migration.' },
        { url: 'https://docs.oracle.com/cd/F26413_09/books/RestAPI/overview-of-using-the-siebel-rest-api.html', role: 'Official Siebel REST API overview.', gap: 'Reference docs; no migration engine.' },
        { url: 'https://docs.oracle.com/en/applications/siebel/siebel-crm/26.3/szapi/index.html', role: 'Siebel REST API 26.3 reference.', gap: 'API reference; no operational layer.' }
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

  app.get('/legacy/health', async () => {
    return await state.siebelMetrics.checkAll();
  });

  app.get('/legacy/metrics', async () => {
    const snap = state.metrics.snapshot();
    const siebelSnap = state.siebelMetrics.snapshot(state.metrics);
    return { operational: snap, legacy: siebelSnap, activeSessions: state.siebelMetrics };
  });
}

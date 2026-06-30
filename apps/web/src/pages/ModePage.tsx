import { SectionHeader, TechnicalBanner } from '../components/ui';

export function ModePage() {
  return (
    <div>
      <SectionHeader
        title="Integration Modes"
        subtitle="LegacyOps can run in seven integration modes — from pure standalone CRM to full progressive replacement."
      />
      <TechnicalBanner>These tools are for developers, architects and migration teams.</TechnicalBanner>

      <div className="grid grid-2">
        <div className="panel">
          <h3>1. Standalone CRM</h3>
          <p>LegacyOps is the only system. No legacy connection. Useful for greenfield deployments and demos.</p>
        </div>
        <div className="panel">
          <h3>2. Synthetic mode</h3>
          <p>LegacyOps runs against the in-memory Fake Siebel Lab. Useful for training, demos and integration tests.</p>
        </div>
        <div className="panel">
          <h3>3. Read-only legacy overlay</h3>
          <p>Operators see legacy data through LegacyOps UI, but writes still go to the legacy system manually.</p>
        </div>
        <div className="panel">
          <h3>4. Workflow wrapper</h3>
          <p>
            LegacyOps guides the operator through a workflow, while the legacy system remains the source of truth. Audit
            and SLA are owned by LegacyOps.
          </p>
        </div>
        <div className="panel">
          <h3>5. Controlled write-back</h3>
          <p>
            LegacyOps writes back to the legacy system through the bridge. Conflicts are detected and surfaced before
            write.
          </p>
        </div>
        <div className="panel">
          <h3>6. Hybrid source-of-truth</h3>
          <p>Some modules are owned by LegacyOps, others by legacy. The source-of-truth registry decides per field.</p>
        </div>
        <div className="panel">
          <h3>7. Progressive replacement</h3>
          <p>
            Module by module, LegacyOps becomes the primary system. Legacy is retired per module after reconciliation.
          </p>
        </div>
      </div>
    </div>
  );
}

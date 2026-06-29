# LegacyOps Console

**LegacyOps Console** is an open-source enterprise CRM modernization platform. It combines:

1. **A complete CRM core** — Customer 360, cases, workflows, audit, RBAC, billing, contracts, services.
2. **A Siebel-like bridge** — conceptual adapters that speak Business Objects, Business Components, Integration Objects and Business Services without copying any proprietary schema.
3. **An anti-corruption layer** — pure-function translators that keep the LegacyOps domain free of legacy coupling.
4. **A migration engine** — source-of-truth registry, entity/field mapping, dry-runs, conflict detection, reconciliation and rollback.
5. **Legacy observability** — health, latency and error metrics for the adapter layer, separated from operational CRM metrics.
6. **A Fake Siebel Lab** — a synthetic Siebel-like backend that reproduces latency, session expiry, permission errors and conflicts.
7. **A pilot playbook and ROI metrics template** — a controlled path from demo to production.

> **Status:** early scaffold. Synthetic data only. Not production-ready.
> See `docs/ENTERPRISE_READINESS_GAP.md` for an honest gap analysis.

---

## Why LegacyOps exists

Many large organisations still depend on legacy CRM platforms (typically Siebel-like) because those systems are deeply integrated with billing, contracts, identity, telephony, provisioning, collections, audit and reporting. Replacing them is risky. Wrapping them with a thin UI is fragile. Deploying a modern CRM in parallel leads to duplication and abandonment.

LegacyOps Console takes a different path: it ships its own CRM core while integrating with the legacy system through an explicit anti-corruption layer. Operators get a modern UI now. Modules migrate one at a time, with dry-runs, conflict detection, reconciliation and rollback. ROI is measured before and after each pilot stage.

For the full positioning, see `docs/LEGACYOPS_VS_LEGACY_CRM.md` and `docs/SELLING_TO_SIEBEL_CUSTOMERS.md`.

---

## Repository structure

```text
legacyops-console/
├── apps/
│   ├── api/                      # Fastify API (TypeScript, ESM)
│   └── web/                      # React + Vite UI
├── packages/
│   ├── domain/                   # CRM core domain
│   ├── shared/                   # Common types and utilities
│   ├── audit/                    # Audit event factory and in-memory log
│   ├── permissions/              # RBAC (roles, permissions, can())
│   ├── workflows/                # Minimal workflow engine + demo workflows
│   ├── adapters/                 # Vendor-neutral adapter contracts
│   ├── siebel-bridge/            # Siebel-like bridge + Fake Siebel Lab
│   ├── migration/                # Source-of-truth registry, dry-run, reconciliation
│   ├── legacy-observability/     # Health, latency, errors for legacy/adapter layer
│   └── demo-data/                # Synthetic dataset
├── docs/                         # Product, architecture, migration, ROI, pilot
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .env.example
└── .gitignore
```

---

## Stack

- **Monorepo**: pnpm workspaces.
- **Language**: TypeScript (ESM, ES2022, strict).
- **API**: Fastify 4.
- **Web**: React 18 + Vite 5 + react-router 6.
- **Tests**: Vitest 2.
- **Data**: in-memory synthetic dataset. No real database in this phase.

> **Decision: Fastify over NestJS.** Fastify is light and fast, and the route modules are organised by domain so a future migration to NestJS controllers would be a refactor, not a rewrite. See `docs/ARCHITECTURE.md`.

---

## Commands

```bash
pnpm install
pnpm dev          # start API + web in parallel
pnpm dev:api      # API only (http://localhost:3001)
pnpm dev:web      # web only (http://localhost:5173)
pnpm build        # build all packages and apps
pnpm test         # run all Vitest tests
pnpm typecheck    # tsc --noEmit across all workspaces
pnpm lint         # placeholder (see note below)
```

> **Lint note**: ESLint/Prettier are not enforced in this scaffold because the workspace has many cross-package type dependencies that would require additional configuration. The `lint` script is a no-op that documents this. Re-enabling lint is a tracked gap in `docs/ENTERPRISE_READINESS_GAP.md`.

---

## Apps

### `apps/api`

Fastify HTTP API. Endpoints cover:

- `/health`
- `/customers`, `/customers/:id`, `/customers/:id/timeline`, `/customers/:id/billing`, `/customers/:id/cases`
- `/cases`, `/interactions`
- `/workflows`, `/workflows/:id/start`, `/workflow-runs/:id/steps/:stepId/complete`
- `/audit-events`
- `/legacy/research-notes`, `/legacy/health`, `/legacy/metrics`
- `/siebel/mock/metadata`, `/siebel/mock/customers`, `/siebel/mock/customers/:id`, `/siebel/mock/service-requests`, `/siebel/mock/business-service/:name/invoke`
- `/migration/source-of-truth`, `/migration/dry-run`, `/migration/reconciliation/demo`, `/migration/plan`
- `/roi/demo`

### `apps/web`

React + Vite UI with the following panels:

- **Operational Dashboard** — high-level snapshot.
- **Customer Search** — searchable customer directory.
- **Customer 360** — full customer context: account, contacts, services, billing, cases, timeline.
- **Cases** — native case list with filters.
- **Workflows** — workflow catalog + run stepper.
- **Supervisor Dashboard** — team KPIs.
- **Siebel Bridge Lab** — interactive Fake Siebel Lab: metadata, contacts, business service invoker.
- **Legacy Observability** — health, latency, errors.
- **Migration Dry Run** — plan, field mapping, dry-run, reconciliation.
- **Source of Truth Map** — registry, module statuses, ID mappings.
- **ROI Metrics** — before/after KPIs.
- **Integration Mode** — the seven modes documented in `docs/INTEGRATION_MODES.md`.

---

## Synthetic data warning

All data served by the API and the web UI is **fictional**. The dataset is generated by `packages/demo-data/` and cached in memory. No real customer data is supported in this phase.

---

## Siebel-like Compatibility Strategy

LegacyOps does **not** copy Siebel. It does **not** depend on Open UI. It does **not** hardcode vendor endpoints. It ships:

- conceptual Siebel-like types in `packages/siebel-bridge/src/contracts/`,
- bidirectional mapping helpers in `packages/siebel-bridge/src/mapping/`,
- a Fake Siebel Lab in `packages/siebel-bridge/src/mock/`,
- integration modes documented in `docs/INTEGRATION_MODES.md`.

For the full posture, see `docs/SIEBEL_COMPATIBILITY_STRATEGY.md` and `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md`.

---

## Progressive Migration Strategy

The migration engine in `packages/migration/` provides:

- `SourceOfTruthRegistry` — per-module, per-field ownership rules.
- `EntityMapping` / `FieldMapping` — configurable field translation.
- `IdMappingStore` — external ↔ internal ID resolution without losing auditability.
- `createDryRunReport` — preview a migration before touching any data.
- `detectConflicts` — duplicate IDs, missing fields, enum mismatches.
- `buildReconciliationReport` — source vs target counts after migration.
- `createRollbackPlan` — explicit rollback steps with a deadline.
- `ModuleMigrationStatus` — module-level cut-over state.

See `docs/MIGRATION_STRATEGY.md` and `docs/INTEGRATION_MODES.md`.

---

## Documentation index

| Document | Purpose |
|---|---|
| `docs/PRODUCT_VISION.md` | Long-term product vision. |
| `docs/ARCHITECTURE.md` | Architecture overview. |
| `docs/MIGRATION_STRATEGY.md` | Migration strategy. |
| `docs/DEMO_SCENARIOS.md` | Demo scenarios. |
| `docs/SECURITY_NOTES.md` | Security posture. |
| `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md` | Public Siebel ecosystem audit. |
| `docs/SIEBEL_COMPATIBILITY_STRATEGY.md` | How LegacyOps integrates with Siebel-like environments. |
| `docs/SIEBEL_OBJECT_MAPPING.md` | Conceptual object mapping table. |
| `docs/SIEBEL_OPENUI_RESEARCH.md` | Optional future role of Open UI. |
| `docs/SIEBEL_OBSERVABILITY_STRATEGY.md` | Legacy observability strategy. |
| `docs/PILOT_PLAYBOOK_SIEBEL.md` | Pilot playbook. |
| `docs/SELLING_TO_SIEBEL_CUSTOMERS.md` | Commercial narrative. |
| `docs/ANTI_CORRUPTION_LAYER.md` | ACL strategy. |
| `docs/LEGACYOPS_VS_LEGACY_CRM.md` | Comparison. |
| `docs/ROI_METRICS.md` | ROI template. |
| `docs/ENTERPRISE_READINESS_GAP.md` | Honest gap analysis. |
| `docs/INTEGRATION_MODES.md` | Seven integration modes. |
| `docs/FAKE_SIEBEL_LAB.md` | Fake Siebel Lab specification. |
| `ROADMAP.md` | Roadmap. |
| `CONTRIBUTING.md` | Contributing guide. |

---

## Current status

- ✅ Monorepo with pnpm workspaces.
- ✅ 10 packages: domain, shared, audit, permissions, workflows, adapters, siebel-bridge, migration, legacy-observability, demo-data.
- ✅ Fastify API with all required endpoints.
- ✅ React + Vite UI with 12 panels.
- ✅ Vitest tests across all packages.
- ✅ Strategic documentation set.
- ⚠️ Synthetic data only.
- ⚠️ No real database, no real Siebel adapter, no SSO, no production hardening.
- ❌ Not production-ready. See `docs/ENTERPRISE_READINESS_GAP.md`.

---

## License

MIT (see repository). No third-party proprietary code is reproduced.

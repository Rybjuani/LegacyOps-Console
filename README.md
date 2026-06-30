# LegacyOps Console

**LegacyOps Console** is an open-source enterprise CRM modernization platform. It combines:

1. **A complete CRM core** — Customer 360, cases, workflows, audit, RBAC, billing, contracts, services.
2. **A Siebel-like bridge** — conceptual adapters that speak Business Objects, Business Components, Integration Objects and Business Services without copying any proprietary schema.
3. **An anti-corruption layer** — pure-function translators that keep the LegacyOps domain free of legacy coupling.
4. **A migration engine** — source-of-truth registry, entity/field mapping, dry-runs, conflict detection, reconciliation and rollback.
5. **Legacy observability** — health, latency and error metrics for the adapter layer, separated from operational CRM metrics.
6. **A Fake Siebel Lab** — a synthetic Siebel-like backend that reproduces latency, session expiry, permission errors and conflicts.
7. **A pilot playbook and ROI metrics template** — a controlled path from demo to production.

> **Status:** hardened scaffold. Synthetic data only. Not production-ready.
> CI, lint, typecheck, tests and build all pass on Node 22.
> See `docs/ENTERPRISE_READINESS_GAP.md` for an honest gap analysis and
> `SECURITY.md` for the security policy.

---

## Why LegacyOps exists

Many large organisations still depend on legacy CRM platforms (typically Siebel-like) because those systems are deeply integrated with billing, contracts, identity, telephony, provisioning, collections, audit and reporting. Replacing them is risky. Wrapping them with a thin UI is fragile. Deploying a modern CRM in parallel leads to duplication and abandonment.

LegacyOps Console takes a different path: it ships its own CRM core while integrating with the legacy system through an explicit anti-corruption layer. Operators get a modern UI now. Modules migrate one at a time, with dry-runs, conflict detection, reconciliation and rollback. ROI is measured before and after each pilot stage.

For the full positioning, see `docs/LEGACYOPS_VS_LEGACY_CRM.md` and `docs/SELLING_TO_SIEBEL_CUSTOMERS.md`.

---

## Repository structure

```text
legacyops-console/
├── .github/
│   ├── workflows/ci.yml          # CI: install, typecheck, lint, test, build, format
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/           # bug_report.md, feature_request.md
├── apps/
│   ├── api/                      # Fastify API (TypeScript, ESM) + RBAC + smoke tests
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
├── SECURITY.md                   # Security policy
├── eslint.config.mjs             # ESLint 9 flat config
├── .prettierrc                   # Prettier config
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .env.example
└── .gitignore
```

---

## Stack

- **Monorepo**: pnpm 9 workspaces.
- **Language**: TypeScript (ESM, ES2022, strict).
- **Node**: 22 LTS (chosen for native ESM, stable fetch API, long-term
  support window).
- **API**: Fastify 4.
- **Web**: React 18 + Vite 5 + react-router 6.
- **Tests**: Vitest 2 (unit + HTTP smoke tests via Fastify `inject`).
- **Lint**: ESLint 9 flat config + typescript-eslint + eslint-plugin-react.
- **Format**: Prettier 3.
- **CI**: GitHub Actions (Node 22) — see `.github/workflows/ci.yml`.
- **Data**: in-memory synthetic dataset. No real database in this phase.

> **Decision: Fastify over NestJS.** Fastify is light and fast, and the route modules are organised by domain so a future migration to NestJS controllers would be a refactor, not a rewrite. See `docs/ARCHITECTURE.md`.

---

## Commands

```bash
pnpm install         # install all workspace dependencies
pnpm dev             # start API + web in parallel (legacy & pnpm, see note)
pnpm dev:api         # API only (http://localhost:3001)
pnpm dev:web         # web only (http://localhost:5173)
pnpm typecheck       # tsc --noEmit across all workspaces
pnpm lint            # ESLint 9 flat config
pnpm lint:fix        # ESLint with --fix
pnpm format          # Prettier --write
pnpm format:check    # Prettier --check (used in CI)
pnpm test            # Vitest run (unit + HTTP smoke tests)
pnpm test:watch      # Vitest watch mode
pnpm build           # build all packages and both apps
pnpm clean           # remove dist/node_modules across workspaces
```

> **`pnpm dev` note**: the root `dev` script starts the API and the web
> dev server with a shell `&`. For parity with the CI build, prefer
> `pnpm dev:api` and `pnpm dev:web` in two terminals when iterating.

---

## Current Verified Status

Last verified on the commit referenced in `git log` for the
`hardening` cycle.

| Capability | Status |
|---|---|
| Monorepo TypeScript pnpm | ✅ |
| `apps/api` Fastify v5 + RBAC simulation | ✅ |
| `apps/web` React + Vite | ✅ |
| 10 packages (domain, shared, audit, permissions, workflows, adapters, siebel-bridge, migration, legacy-observability, demo-data) | ✅ |
| `pnpm install --frozen-lockfile` | ✅ reproducible |
| `pnpm typecheck` | ✅ passes |
| `pnpm lint` (ESLint 9 flat config, no errors) | ✅ passes |
| `pnpm format:check` (Prettier) | ✅ passes |
| `pnpm test` (unit + HTTP smoke tests) | ✅ 103 tests pass |
| `pnpm build` (packages + api + web) | ✅ passes |
| `pnpm audit --prod --audit-level=high` | ✅ 0 vulnerabilities |
| GitHub Actions CI (Node 22) | ✅ 4 jobs: verify, format-check, secret-scan-lite, dependency-audit |
| RBAC enforcement in API (header-based) | ✅ simulated, not auth |
| Deterministic error simulation tests | ✅ 24 tests, no flakiness |
| SECURITY.md | ✅ |
| Synthetic data only | ✅ |
| No secrets in repo (CI scans for github_pat_, ghp_, AKIA, xoxb-, private key blocks) | ✅ |
| Enterprise readiness issues | ✅ 5 issues opened (#1–#5) |
| Real Siebel REST adapter foundation | ✅ Shipped (mock-tested, not sandbox-validated) |
| Real database | ❌ pending (issue #2) |
| Real SSO/OIDC/SAML | ❌ pending (issue #1) |
| Real Siebel sandbox validation | ❌ pending (issue #4) |
| Durable append-only audit log | ❌ pending (issue #3) |
| Container image + Helm chart | ❌ pending (issue #5) |
| Production deployment | ❌ pending |

---

## API RBAC Simulation

The API enforces the permission matrix defined in
`packages/permissions/src/index.ts`. The role is read from the
`x-legacyops-role` HTTP header. If absent, the default role is
`operator`.

```bash
# operator (default) — can read customers, cases, billing
curl http://localhost:3001/customers

# admin — can read migration, siebel bridge, audit, everything
curl -H 'x-legacyops-role: admin' http://localhost:3001/migration/source-of-truth

# auditor — can read audit-events but NOT run migration
curl -H 'x-legacyops-role: auditor' http://localhost:3001/audit-events
curl -H 'x-legacyops-role: auditor' -X POST http://localhost:3001/migration/dry-run  # → 403
```

Available roles: `operator`, `senior_operator`, `supervisor`,
`backoffice`, `retention_agent`, `collections_agent`, `auditor`,
`admin`.

Denied requests return:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Role operator cannot perform integration:configure"
  }
}
```

Permission-denied events are recorded in the in-memory audit log.

> **This is NOT authentication.** Any HTTP client can set the
> `x-legacyops-role` header. Real SSO/OIDC/SAML integration is a tracked
> gap. See `SECURITY.md` and `docs/SECURITY_NOTES.md`.

---

## Not Production Ready

This scaffold is honest about its limits. The following are **NOT** ready
for production:

- **No real authentication.** The `x-legacyops-role` header is a demo
  primitive, not auth.
- **No real database.** All data is in-memory and resets on restart.
- **No real Siebel adapter.** Only the Fake Siebel Lab is shipped.
- **No audit log durability.** The audit log is in-memory.
- **No rate limiting, no WAF, no TLS termination.** These are expected
  from a reverse proxy in a real deployment.
- **No SSO/OIDC/SAML.**
- **No secret management.** `.env` is for local dev only.
- **No compliance artifacts.** GDPR, CCPA, SOC 2, ISO 27001 are all
  pending.
- **No load testing, chaos testing, or e2e browser testing.**
- **No container image or Helm chart.**

See `docs/ENTERPRISE_READINESS_GAP.md` for the full gap analysis and
prioritised closing plan.

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
| `SECURITY.md` | Security policy, secret handling, vulnerability reporting. |
| `docs/PRODUCT_VISION.md` | Long-term product vision. |
| `docs/ARCHITECTURE.md` | Architecture overview. |
| `docs/MIGRATION_STRATEGY.md` | Migration strategy. |
| `docs/DEMO_SCENARIOS.md` | Demo scenarios. |
| `docs/SECURITY_NOTES.md` | Security posture (companion to `SECURITY.md`). |
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
| `docs/FAKE_SIEBEL_ERROR_MODEL.md` | Fake Siebel error simulation model. |
| `docs/SIEBEL_BRIDGE_CONTRACTS.md` | Siebel bridge contracts (DTOs, transports, mapping). |
| `docs/REAL_SIEBEL_ADAPTER.md` | Real Siebel REST adapter foundation. |
| `docs/SIEBEL_REST_ADAPTER_TESTING.md` | How the real adapter is tested. |
| `docs/SIEBEL_SANDBOX_ONBOARDING.md` | What to ask a customer for a sandbox pilot. |
| `docs/PRODUCT_REQUIREMENTS.md` | Product requirements. |
| `docs/MVP_DEFINITION.md` | MVP definition. |
| `docs/ENTERPRISE_PILOT_CHECKLIST.md` | Enterprise pilot checklist. |
| `docs/SALES_DEMO_SCRIPT.md` | 30-minute sales demo script. |
| `docs/SIEBEL_MODERNIZATION_ROI_MODEL.md` | ROI model with risk-adjusted return. |
| `docs/TECHNICAL_DUE_DILIGENCE.md` | Buyer's technical review checklist. |
| `ROADMAP.md` | Roadmap. |
| `CONTRIBUTING.md` | Contributing guide. |

---

## Current status

- ✅ Monorepo with pnpm 9 workspaces, TypeScript strict, ESM.
- ✅ 10 packages: domain, shared, audit, permissions, workflows, adapters, siebel-bridge, migration, legacy-observability, demo-data.
- ✅ Fastify v5 API with all required endpoints + simulated RBAC enforcement.
- ✅ React + Vite UI with 12 panels.
- ✅ 266 Vitest tests (240 unit + 26 HTTP smoke tests via Fastify `inject`).
- ✅ ESLint 9 flat config + Prettier — both clean.
- ✅ GitHub Actions CI (Node 22) — 4 jobs: verify, format-check, secret-scan-lite, dependency-audit.
- ✅ `pnpm audit --prod --audit-level=high` clean (0 vulnerabilities).
- ✅ SECURITY.md, PR template, issue templates.
- ✅ 5 enterprise-readiness issues opened (#1 SSO, #2 PostgreSQL, #3 durable audit, #4 real Siebel adapter, #5 container image).
- ✅ RealSiebelAdapter foundation: config, HTTP client, retry, circuit breaker, error mapper, session manager, defensive payload mapper, adapter — all mock-tested.
- ✅ Siebel adapter diagnostic endpoints: `/siebel/adapter/status`, `/siebel/adapter/config-schema`, `/siebel/adapter/endpoint-map`.
- ✅ Strategic documentation set (29 docs).
- ⚠️ Synthetic data only.
- ⚠️ RealSiebelAdapter NOT validated against a real Siebel sandbox (issue #4 open).
- ⚠️ No real database, no SSO/OIDC/SAML, no production hardening.
- ❌ Not production-ready. See `docs/ENTERPRISE_READINESS_GAP.md`.

---

## License

MIT (see repository). No third-party proprietary code is reproduced.

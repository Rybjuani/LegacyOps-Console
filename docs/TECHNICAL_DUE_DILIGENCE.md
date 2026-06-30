# Technical Due Diligence — LegacyOps Console

> A buyer's technical review checklist. This document exists so that a
> prospect's IT, security and architecture teams can evaluate LegacyOps
> without surprises.

---

## 1. Architecture

### 1.1 Stack

- **Monorepo**: pnpm 9 workspaces, TypeScript strict, ESM.
- **API**: Fastify v5 (Node 22 LTS).
- **Web**: React 18 + Vite 5 + react-router 6.
- **Tests**: Vitest 2 (unit + HTTP smoke tests via Fastify `inject`).
- **Lint**: ESLint 9 flat config + typescript-eslint + eslint-plugin-react.
- **Format**: Prettier 3.
- **CI**: GitHub Actions, Node 22.
- **Data**: in-memory synthetic dataset (no real DB in this phase).

### 1.2 Packages

| Package | Role |
|---|---|
| `packages/domain` | Pure CRM domain: entities, helpers, no side effects. |
| `packages/shared` | Common types, API envelope, pagination, IDs. |
| `packages/audit` | Audit event factory and in-memory log. |
| `packages/permissions` | RBAC: roles, permissions, `can(role, perm)`. |
| `packages/workflows` | Workflow engine: definitions, runs, conditional next, role per step. |
| `packages/adapters` | Vendor-neutral adapter contracts. |
| `packages/siebel-bridge` | Siebel-like DTOs, ACL mapping, Fake Siebel Lab, transport contracts. |
| `packages/migration` | Source-of-truth registry, dry-run, conflicts, reconciliation, rollback. |
| `packages/legacy-observability` | Health, latency, errors, Prometheus-like snapshot. |
| `packages/demo-data` | Synthetic dataset, migration artifacts, ROI baseline. |

### 1.3 Anti-corruption layer

The LegacyOps domain does NOT import from `packages/siebel-bridge`. All
translation happens in `packages/siebel-bridge/src/mapping/` through
pure functions. This is enforced by package boundaries and reviewed in
every PR.

---

## 2. Security

### 2.1 Authentication

- ❌ No real authentication. Simulated RBAC via `x-legacyops-role` header.
- ❌ No SSO / OIDC / SAML. Tracked in issue #1.
- ✅ RBAC enforced at the API route level through `withPermission(perm)`.
- ✅ Permission-denied events recorded in the audit log.

### 2.2 Secrets

- ✅ No secrets in the repository (CI runs `secret-scan-lite`).
- ✅ `.env` is gitignored.
- ✅ `.env.example` contains only inert placeholders.
- ❌ No secret management (Vault, KMS). Tracked in issue #1.

### 2.3 Data

- ✅ Synthetic data only. No real PII.
- ✅ No real customer data supported in this phase.
- ❌ No field-level encryption. Tracked in `docs/ENTERPRISE_READINESS_GAP.md`.

### 2.4 Dependencies

- ✅ `pnpm audit --prod --audit-level=high` clean.
- ✅ CI runs the audit on every push and pull request.
- ✅ Fastify v5 (closes 3 high CVEs from Fastify v4).

### 2.5 Transport

- ❌ No TLS termination in the scaffold. Expected from a reverse proxy in production.
- ❌ No rate limiting. Tracked in `docs/ENTERPRISE_READINESS_GAP.md`.
- ✅ CORS configurable via `CORS_ORIGIN`.

---

## 3. Auditability

- ✅ Every state-changing operator action produces an audit event.
- ✅ Audit event types: `case.created`, `case.updated`, `case.assigned`, `case.escalated`, `case.comment_added`, `workflow.started`, `workflow.step_completed`, `workflow.cancelled`, `interaction.started`, `interaction.closed`, `permission.denied`, `external.adapter_call`, `migration.event`.
- ❌ Audit log is in-memory. Durable append-only storage tracked in issue #3.
- ❌ No SIEM export. Tracked in issue #3.

---

## 4. Testing

- ✅ 145+ tests pass deterministically.
- ✅ Unit tests for every package.
- ✅ HTTP smoke tests via Fastify `inject` (no real port).
- ✅ Deterministic error simulation tests (no flakiness from `Math.random()`).
- ❌ No load testing.
- ❌ No chaos testing.
- ❌ No end-to-end browser testing.

---

## 5. CI/CD

- ✅ GitHub Actions workflow with 4 jobs: `verify`, `format-check`, `secret-scan-lite`, `dependency-audit`.
- ✅ CI runs on every push and pull request to `main`.
- ❌ No deployment pipeline. Tracked in issue #5.
- ❌ No container image. Tracked in issue #5.

---

## 6. Migration engine

- ✅ Source-of-truth registry per module and per field.
- ✅ Entity / field mapping with validation.
- ✅ ID mapping store (external ↔ internal).
- ✅ Dry-run report with conflict detection.
- ✅ Reconciliation report.
- ✅ Rollback plan preview.
- ❌ No persistent migration run state. In-memory only.

---

## 7. Siebel-like bridge

- ✅ Conceptual DTOs: Account, Contact, Service Request, Asset, Activity, Order, Business Object, Integration Object, Business Service.
- ✅ Bidirectional mapping helpers.
- ✅ Fake Siebel Lab with deterministic + stochastic error simulation.
- ✅ Transport contracts (REST / SOAP / EAI) defined.
- ❌ No real Siebel REST adapter. Tracked in issue #4.

---

## 8. Observability

- ✅ Health checks per component.
- ✅ Adapter latency (p50, p95, p99).
- ✅ Failed external calls.
- ✅ Prometheus-like text endpoint at `/legacy/metrics/prometheus`.
- ✅ Separation from CRM operational metrics.
- ❌ No real Prometheus / Grafana integration. The endpoint is text/plain; a real deployment would scrape it.

---

## 9. Compliance

- ❌ No GDPR / CCPA data subject request handling.
- ❌ No data residency controls.
- ❌ No SOC 2 / ISO 27001 readiness artifacts.
- ❌ No data classification labels.

All tracked in `docs/ENTERPRISE_READINESS_GAP.md`.

---

## 10. Open questions for the buyer

1. What is the sandbox Siebel-like endpoint? (Required for stage 2.)
2. What is the service account model? (Read-only for stages 2–3, write for stages 4–5.)
3. What is the SIEM in use? (Drives the audit log export format.)
4. What is the identity provider? (Drives the SSO integration in issue #1.)
5. What is the Kubernetes distribution? (Drives the Helm chart in issue #5.)
6. What is the data residency requirement? (Drives the deployment topology.)

---

## 11. Sign-off

A technical due diligence review is complete when the buyer's IT,
security and architecture teams have:

- [ ] Read this document.
- [ ] Read `docs/ENTERPRISE_READINESS_GAP.md`.
- [ ] Read `SECURITY.md`.
- [ ] Run the demo locally.
- [ ] Verified that CI passes on `main`.
- [ ] Verified that `pnpm audit --prod --audit-level=high` is clean.
- [ ] Signed off on the pilot scope.

---

## 12. Reference

- `docs/ENTERPRISE_READINESS_GAP.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- `docs/ARCHITECTURE.md`
- `SECURITY.md`
- `docs/SECURITY_NOTES.md`

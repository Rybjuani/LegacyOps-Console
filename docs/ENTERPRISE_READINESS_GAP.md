# Enterprise Readiness Gap

> Honest assessment of what LegacyOps Console is missing for production
> enterprise deployment. This document exists so no prospect, pilot
> customer or auditor is misled.

---

## 1. Current status

LegacyOps Console is a **hardened synthetic scaffold**. It runs entirely
on in-memory data and a Fake Siebel Lab. The hardening cycle added:

- GitHub Actions CI (Node 22) running install, typecheck, lint, test,
  build and Prettier format check on every push and pull request.
- ESLint 9 flat config with typescript-eslint and eslint-plugin-react.
- Prettier with `format:check` enforced in CI.
- Simulated RBAC enforcement in the API (`x-legacyops-role` header)
  applied to all sensitive endpoints. Not authentication — see below.
- HTTP smoke tests covering 20 scenarios including RBAC denials.
- `SECURITY.md` with secret handling, vulnerability reporting and data
  policies.
- Pull request template and GitHub issue templates.
- Secret scanning grep in CI for `github_pat_`, `ghp_`, `GITHUB_TOKEN=`.
- Vitest test count: 67 (47 unit + 20 HTTP smoke).
- **NEW (this cycle):** `secret-scan-lite` job in CI with allowlist for
  documentation files that mention token patterns.
- **NEW (this cycle):** `dependency-audit` job running
  `pnpm audit --prod --audit-level=high`. Fails only on high/critical.
- **NEW (this cycle):** Fastify upgraded to v5.7+ to close 3 high CVEs
  (content-type bypass, fast-uri path traversal, fast-uri host confusion).
- **NEW (this cycle):** Deterministic error simulation tests in
  `packages/siebel-bridge/src/mock/FakeSiebelErrorSimulator.test.ts` and
  `FakeSiebelAdapter.errors.test.ts` (24 new tests, no flakiness).
- **NEW (this cycle):** Smoke tests expanded to 36 scenarios covering
  RBAC edge cases (missing role, unknown role, casing), audit log
  permission-denied events, and error envelope consistency (403/404/400).
- **NEW (this cycle):** 5 enterprise-readiness issues opened for tracking:
  #1 SSO/OIDC/SAML, #2 PostgreSQL, #3 durable audit log, #4 real Siebel
  REST adapter, #5 container image + deployment.

It is suitable for:

- demos
- training
- architecture validation
- pilot preparation
- integration testing against synthetic data

It is **not** suitable for production use with real customer data.

---

## 2. Gaps by category

### 2.1 Security

- ✅ Simulated RBAC enforcement at the API route level
  (`apps/api/src/rbac.ts`). Header `x-legacyops-role`, default `operator`.
  Permission-denied events recorded in the audit log.
- ❌ No real authentication (SSO / OIDC / SAML). The header is a demo
  primitive.
- ❌ No multi-factor authentication.
- ❌ No secret management (secrets are inert placeholders in `.env`).
- ❌ No field-level encryption.
- ❌ No PII handling policy implementation.
- ❌ No rate limiting.

### 2.2 Database

- ❌ No real database. All data is in-memory.
- ❌ No persistence across restarts.
- ❌ No transactional integrity.
- ❌ No backup / restore.

### 2.3 High availability & deployment

- ❌ No HA topology.
- ❌ No container image published.
- ❌ No Helm chart.
- ❌ No production deployment guide.
- ❌ No health probe for Kubernetes (the `/health` endpoint exists but
  is not ready for liveness/readiness probes).

### 2.4 Logging

- ❌ No structured logging pipeline.
- ❌ No log aggregation integration.
- ❌ No correlation ID propagation across services.

### 2.5 Audit hardening

- ⚠️ Audit log is in-memory. Production needs append-only, tamper-evident
  storage.
- ❌ No audit log export to SIEM.
- ❌ No audit log retention policy.

### 2.6 Testing

- ✅ Unit tests exist for domain, permissions, workflows, audit,
  migration, siebel-bridge, observability, demo-data.
- ✅ HTTP smoke tests using Fastify `inject` (no real port) covering 20
  scenarios including RBAC denials, customer 360, siebel bridge,
  migration dry-run, ROI, audit.
- ✅ 67 tests pass in CI on Node 22.
- ❌ No load testing.
- ❌ No chaos testing for adapter failures (the `FakeSiebelErrorSimulator`
  exists but is not driven by chaos tests yet).
- ❌ No end-to-end browser tests.

### 2.7 Compliance

- ❌ No GDPR / CCPA data subject request handling.
- ❌ No data residency controls.
- ❌ No SOC 2 / ISO 27001 readiness artifacts.
- ❌ No data classification labels.

### 2.8 Real integrations

- ✅ `RealSiebelAdapter` foundation implemented behind `SiebelBridge`
  contract (config loader, HTTP client, retry, circuit breaker, error
  mapper, session manager, defensive payload mapper, adapter). Tested
  against mocked REST behaviour.
- ❌ Validation against a real Siebel sandbox still pending (issue #4).
  The adapter is NOT enabled by default; `LEGACYOPS_SIEBEL_ADAPTER=real`
  is required, plus a valid `RealSiebelConfig`.
- ❌ No real billing provider adapter.
- ❌ No real auth provider adapter.
- ❌ No real knowledge base adapter.
- ❌ No real observability backend integration (only mock collectors).

### 2.9 Legal review

- ❌ No legal review of the public ecosystem audit notes.
- ❌ No legal review of the Siebel-like conceptual types.
- ❌ No trademark / copyright review.

### 2.10 Pilot hardening

- ❌ No pilot data import template.
- ❌ No pilot success criteria validation tooling.
- ❌ No pilot rollback automation.
- ❌ No pilot audit export tooling.

---

## 3. Priority order for closing gaps

1. **Security**: SSO, real auth, secret management, rate limiting.
   (Simulated RBAC enforcement is already in place; it needs to be
   backed by a real identity provider.)
2. **Database**: pick a real DB (PostgreSQL recommended), add
   migrations, persistence.
3. **Audit hardening**: append-only storage, SIEM export, retention.
4. **Real Siebel adapter**: implement the bridge contract against a
   real Siebel REST endpoint.
5. **Logging**: structured logs, correlation IDs, aggregation.
6. **Deployment**: container image, Helm chart, deployment guide.
7. **Compliance**: GDPR/CCPA, data residency.
8. **Testing**: load, chaos, e2e (HTTP smoke tests already in place).
9. **Pilot hardening**: import template, rollback automation.
10. **Legal review**: trademarks, copyrights, ecosystem audit notes.

---

## 4. What is already production-shaped

Even though the scaffold is not production-ready, several pieces are
shaped for production:

- The **domain** is pure, typed, side-effect-free.
- The **adapter contracts** are vendor-neutral and ready for real
  implementations.
- The **ACL** (mapping helpers) is original, tested, and free of
  proprietary schemas.
- The **migration engine** has dry-run, conflict detection,
  reconciliation and rollback as first-class operations.
- The **audit log** has the right event types and records
  permission-denied events; only the durable storage backend is missing.
- The **observability layer** has the right metric types; only real
  collectors are missing.
- The **permissions model** is correct and is **enforced at the API
  route level** via `preHandler` hooks. What is missing is real
  authentication backing the role.
- The **CI pipeline** runs install, typecheck, lint, test, build and
  format:check on every push and pull request.
- The **HTTP smoke tests** exercise 20 scenarios through Fastify
  `inject`, including RBAC denials.
- The **SECURITY.md** policy documents secret handling, vulnerability
  reporting and data policies.

---

## 5. Reference

- `SECURITY.md` — canonical security policy.
- `docs/SECURITY_NOTES.md` — security posture (companion to `SECURITY.md`).
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md` — legal/ecosystem audit.

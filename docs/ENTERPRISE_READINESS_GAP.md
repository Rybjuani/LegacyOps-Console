# Enterprise Readiness Gap

> Honest assessment of what LegacyOps Console is missing for production
> enterprise deployment. This document exists so no prospect, pilot
> customer or auditor is misled.

---

## 1. Current status

LegacyOps Console is a **synthetic scaffold**. It runs entirely on
in-memory data and a Fake Siebel Lab. It is suitable for:

- demos
- training
- architecture validation
- pilot preparation
- integration testing against synthetic data

It is **not** suitable for production use with real customer data.

---

## 2. Gaps by category

### 2.1 Security

- ❌ No SSO / OIDC / SAML integration.
- ❌ No multi-factor authentication.
- ❌ No secret management (secrets are inert placeholders in `.env`).
- ❌ No field-level encryption.
- ❌ No PII handling policy implementation.
- ❌ No RBAC at the API layer (the `permissions` package exists but the
  API does not enforce it yet).
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
- ❌ No integration tests against a real HTTP server.
- ❌ No load testing.
- ❌ No chaos testing for adapter failures.
- ❌ No end-to-end UI tests.

### 2.7 Compliance

- ❌ No GDPR / CCPA data subject request handling.
- ❌ No data residency controls.
- ❌ No SOC 2 / ISO 27001 readiness artifacts.
- ❌ No data classification labels.

### 2.8 Real integrations

- ❌ No real Siebel REST adapter (only the Fake Siebel Lab).
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

1. **Security**: SSO, secret management, API RBAC enforcement, rate
   limiting.
2. **Database**: pick a real DB (PostgreSQL recommended), add
   migrations, persistence.
3. **Audit hardening**: append-only storage, SIEM export, retention.
4. **Real Siebel adapter**: implement the bridge contract against a
   real Siebel REST endpoint.
5. **Logging**: structured logs, correlation IDs, aggregation.
6. **Deployment**: container image, Helm chart, deployment guide.
7. **Compliance**: GDPR/CCPA, data residency.
8. **Testing**: integration, load, chaos, e2e.
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
- The **audit log** has the right event types; only the storage backend
  is missing.
- The **observability layer** has the right metric types; only real
  collectors are missing.
- The **permissions model** is correct; only API enforcement is missing.

---

## 5. Reference

- `docs/SECURITY_NOTES.md` — security posture.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md` — legal/ecosystem audit.

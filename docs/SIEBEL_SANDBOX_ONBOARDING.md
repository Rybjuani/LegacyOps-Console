# Siebel Sandbox Onboarding

> What to ask a customer for, before a technical pilot of the
  RealSiebelAdapter can begin. This is the checklist for the IT/security
  sponsor on the customer side.

---

## 1. Why this document exists

The `RealSiebelAdapter` foundation is implemented and tested against
mocked REST behaviour. To validate it against a real Siebel-like system,
LegacyOps needs access to a **sandbox** (never production). This document
lists everything the customer must provide before stage 2 (read-only
overlay) of the pilot can start.

---

## 2. What to ask the customer for

### 2.1 Endpoint

- [ ] Sandbox base URL (e.g. `https://siebel-sandbox.customer.com`).
- [ ] Confirm the sandbox is NOT production and does NOT contain real
  customer PII (or that PII is anonymised).
- [ ] Confirm the sandbox is reachable from the LegacyOps API host
  (network, firewall, VPN, IP allowlist).

### 2.2 Authentication

- [ ] Which auth mode is supported: `basic`, `session`, or `oauth`?
- [ ] If `basic`: a service account username + password.
- [ ] If `session`: the session login endpoint and token format.
- [ ] If `oauth`: the token endpoint, client ID + secret, and scope.
- [ ] Confirm the service account has READ-ONLY permissions for stage 2.
- [ ] Confirm the credentials can be rotated.
- [ ] Confirm MFA is NOT required for the service account (or provide a
  machine-friendly alternative).

### 2.3 Business Objects & Components

Confirm the following Business Objects are exposed via REST:

- [ ] Account
- [ ] Contact
- [ ] Service Request
- [ ] Asset (Asset Mgmt)
- [ ] Activity (Action)
- [ ] Order (Order Entry)
- [ ] Invoice (if billing visibility is in scope)

For each, provide:

- [ ] The exact REST path (e.g. `/siebel/v1.0/data/Account/Account`).
- [ ] The available search operators (`searchspec`, `query`, etc.).
- [ ] The field names for: Id, Name/Subject, Status, Created, Updated.
- [ ] Any custom fields that should be mapped.

### 2.4 Business Services

- [ ] List of Business Services the service account is allowed to invoke.
- [ ] For each, the methods and their input/output shapes.
- [ ] Rate limits (calls per minute / hour / day).

### 2.5 Rate limits & quotas

- [ ] Maximum requests per second.
- [ ] Maximum concurrent requests.
- [ ] Daily quota.
- [ ] What HTTP status is returned on rate limit (typically 429).
- [ ] Whether rate limit headers are returned (`Retry-After`, etc.).

### 2.6 Network

- [ ] IP allowlist (LegacyOps API host IP(s) must be added).
- [ ] VPN requirement (if any).
- [ ] TLS version requirement.
- [ ] Whether self-signed certificates are used (and if so, how to
  validate them).
- [ ] Whether a reverse proxy is in front of Siebel (and its URL).

### 2.7 Legal & compliance

- [ ] Confirmation that the sandbox data is synthetic or anonymised.
- [ ] Signed NDA between the customer and LegacyOps.
- [ ] Pilot agreement defining scope, duration, success criteria.
- [ ] Data processing agreement (if any PII touches LegacyOps).
- [ ] Right to audit (the customer's right to review LegacyOps logs).
- [ ] Right to revoke access (the customer can disable the service
  account at any time).

### 2.8 Operations

- [ ] A named operations sponsor (escalation path).
- [ ] A named IT sponsor (network/config changes).
- [ ] A named audit/compliance sponsor (review of audit logs).
- [ ] Pilot success criteria signed off (AHT, FCR, escalation rate).
- [ ] Rollback plan reviewed and signed off.

---

## 3. Initial objects to validate

The first read-only overlay (stage 2) should cover, in order:

1. **Account** — read by id, list by search.
2. **Contact** — read by id, search by name/email/phone.
3. **Service Request** — list by account, read by id.
4. **Asset** — list by account.
5. **Activity** — list by account.
6. **Order** — list by account.
7. **Invoice** — list by account (if billing visibility is in scope).

Each object is validated against the `RealSiebelPayloadMapper`. If a
field name does not match, the mapper is extended with a new alias (no
proprietary schema is copied).

---

## 4. Success criteria for sandbox onboarding

Sandbox onboarding is complete when:

- [ ] `GET /siebel/adapter/status` returns `mode: real`, `realConfigured: true`.
- [ ] `GET /legacy/health` returns `overall: healthy`.
- [ ] At least one read of each initial object succeeds.
- [ ] The audit log records `external.adapter_call` events for each call.
- [ ] No credentials appear in any log or API response.
- [ ] The circuit breaker has not opened during normal operation.
- [ ] Latency p95 is below the customer's acceptable threshold.

---

## 5. Rollback

If sandbox onboarding fails or the pilot is paused:

1. Set `LEGACYOPS_SIEBEL_ADAPTER=fake` (or unset).
2. Restart the API.
3. The API falls back to the Fake Siebel Lab.
4. All demo and test endpoints continue to work.
5. No data is lost (the sandbox remains under the customer's control).

---

## 6. Reference

- `docs/REAL_SIEBEL_ADAPTER.md`
- `docs/SIEBEL_REST_ADAPTER_TESTING.md`
- `docs/PILOT_PLAYBOOK_SIEBEL.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- Issue #4 on GitHub

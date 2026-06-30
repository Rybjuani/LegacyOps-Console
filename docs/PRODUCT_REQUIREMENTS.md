# Product Requirements — LegacyOps Console

> What the product must be, who it is for, and what it must do. Companion
> to `docs/PRODUCT_VISION.md`.

---

## 1. Purpose

LegacyOps Console is an enterprise CRM modernization platform. It combines:

1. A complete CRM core (own domain, workflows, audit, RBAC).
2. A Siebel-like bridge with anti-corruption layer.
3. A migration engine (source-of-truth, dry-run, reconciliation, rollback).
4. Legacy observability separated from operational CRM metrics.
5. A Fake Siebel Lab for demos, training and integration tests.
6. ROI metrics and a pilot playbook.

The product is NOT a generic CRM. It is a coexistence and progressive
migration platform for companies that operate Siebel-like legacy CRMs.

---

## 2. Target users

| Persona | Primary use |
|---|---|
| Operator (call center agent) | Customer 360, interaction console, case creation, workflow stepper. |
| Senior operator | Same as operator + case assignment, escalation. |
| Supervisor | Team KPIs, queues, escalations, audit visibility. |
| Backoffice | Migration dry-runs, source-of-truth configuration, reconciliation. |
| Retention agent | Cancellation-retention workflows, retention offers. |
| Collections agent | Payment-promise workflows, debt tracking. |
| Auditor | Read-only audit log access, compliance reviews. |
| Admin | All of the above + user/team/queue configuration. |

---

## 3. Must-have capabilities

### 3.1 CRM core

- Customer 360 with account, contacts, contracts, services, billing, cases, timeline.
- Native case management: create, update, assign, escalate, comment, close.
- Interaction console with guided 7-step flow.
- Workflow engine with conditional next step, role requirement per step, validation, audit.
- Audit log with permission.denied events and append semantics (durable storage pending — issue #3).

### 3.2 Siebel-like bridge

- Conceptual DTOs: Account, Contact, Service Request, Asset, Activity, Order, Business Object, Integration Object, Business Service.
- Bidirectional mapping helpers (anti-corruption layer).
- Fake Siebel Lab with deterministic + stochastic error simulation.
- Transport contracts (REST / SOAP / EAI) ready for real adapter (issue #4).

### 3.3 Migration engine

- Source-of-truth registry per module and per field.
- Entity / field mapping with validation.
- ID mapping store (external ↔ internal).
- Dry-run report with conflict detection.
- Reconciliation report (matched / only-source / only-target / mismatches).
- Rollback plan with explicit steps and deadline.
- Module migration status (not_started / shadow / dual_write / cut_over / retired_legacy).

### 3.4 Legacy observability

- Health checks per component.
- Adapter latency (p50, p95, p99).
- Failed external calls.
- Prometheus-like text endpoint at `/legacy/metrics/prometheus`.
- Separation from CRM operational metrics.

### 3.5 ROI metrics

- Before/after KPIs: AHT, FCR, escalations, training weeks, audit time.
- `POST /roi/calculate` with custom inputs.
- Monthly, annual savings and hours recovered.

### 3.6 Pilot readiness

- Pilot playbook with 6 stages.
- Success criteria defined per stage.
- Rollback plan per stage.
- Honest enterprise readiness gap document.

---

## 4. Non-goals (this phase)

- Real authentication (SSO/OIDC/SAML) — tracked in issue #1.
- Real database persistence — tracked in issue #2.
- Durable audit log — tracked in issue #3.
- Real Siebel REST adapter — tracked in issue #4.
- Container image and deployment — tracked in issue #5.
- AI assistance.
- Omnichannel inbox.
- Telephony/CTI.
- Mobile supervisor app.
- Customer portal.

---

## 5. Success criteria for the current phase

- All CI jobs pass on every push to main.
- 145+ tests pass deterministically.
- Demo can be run end-to-end from the UI without manual data entry.
- Pilot playbook can be read by a non-technical buyer and understood.
- ROI calculator can be exercised with custom inputs in <30 seconds.

---

## 6. Reference

- `docs/PRODUCT_VISION.md`
- `docs/ARCHITECTURE.md`
- `docs/MVP_DEFINITION.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- `ROADMAP.md`

# MVP Definition — LegacyOps Console

> What is the minimum viable product that can be shown to a Siebel-like
> customer to validate the thesis.

---

## 1. MVP thesis

> LegacyOps Console can reduce operational friction in a call center that
> uses a Siebel-like CRM, without requiring a rip-and-replace, and the
> savings can be measured.

If this thesis is true, the customer moves to a pilot. If it is false,
the product is not viable for that customer.

---

## 2. MVP demo flow

The MVP demo must cover, in order:

1. **Dashboard** — operator sees a high-level snapshot of customers, cases, workflows, audit.
2. **Customer Search** — operator finds a customer by name, document, email or phone.
3. **Customer 360** — operator sees identity, account, contacts, services, billing, cases, timeline, with source-of-truth badges.
4. **Interaction Console** — operator runs a full 7-step interaction: select customer → verify identity → choose reason → run workflow → create case → add note → close.
5. **Case Management** — operator can comment, assign, escalate a case; audit events are produced for each action.
6. **Workflow Stepper** — operator sees conditional next step and role requirement per step.
7. **Siebel Bridge Lab** — backoffice explores Business Objects, Integration Objects, Business Services; invokes a business service.
8. **Migration Dry Run** — backoffice runs a dry-run, sees conflicts, resolves one, previews rollback plan.
9. **Source of Truth Map** — backoffice sees per-module ownership and module migration status.
10. **Legacy Observability** — backoffice sees component health, adapter latency, errors, Prometheus-like endpoint.
11. **ROI Metrics** — buyer sees before/after KPIs and computes custom savings.

Each step must be reachable from the navigation sidebar in <3 clicks.

---

## 3. MVP technical requirements

- All endpoints covered by smoke tests (HTTP inject, deterministic).
- RBAC enforcement in the API (simulated, header-based).
- Deterministic error simulation in the Fake Siebel Lab.
- `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- CI runs on every push and pull request.
- `pnpm audit --prod --audit-level=high` clean.
- No secrets in the repository.

---

## 4. MVP non-requirements

- Real authentication.
- Real database.
- Real Siebel adapter.
- Container image.
- Load testing.
- Compliance artifacts.

These are tracked in issues #1–#5 and `docs/ENTERPRISE_READINESS_GAP.md`.

---

## 5. MVP acceptance

The MVP is accepted when a buyer who operates a Siebel-like CRM can,
in a 30-minute demo:

1. Understand the difference between LegacyOps and a generic CRM.
2. See their own operational flow reproduced (interaction → case → workflow → audit).
3. See the migration path (dry-run → conflicts → reconciliation → rollback).
4. See the ROI model with their own numbers.
5. Read the pilot playbook and understand the next steps.

If any of these fails, the MVP is not viable.

---

## 6. Reference

- `docs/SALES_DEMO_SCRIPT.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- `docs/SIEBEL_MODERNIZATION_ROI_MODEL.md`
- `docs/PRODUCT_REQUIREMENTS.md`

# Roadmap — LegacyOps Console

## 1. Roadmap Philosophy

LegacyOps Console evolves from a synthetic but realistic CRM demo into a
complete enterprise CRM with migration-ready architecture.

The roadmap is incremental, but the product ambition is complete.

The project avoids two traps:

1. Building a generic CRUD system with no operational depth.
2. Promising enterprise replacement before the core product is proven.

Each milestone produces something demonstrable, testable and useful for
portfolio or pilot conversations.

---

## 2. Milestone Status (this scaffold)

| Milestone | Status | Notes |
|---|---|---|
| M0 — Repository Foundation | ✅ Done | Docs, structure, scripts. |
| M1 — Synthetic CRM Dataset | ✅ Done | `packages/demo-data/`. |
| M2 — Customer 360 | ✅ Done | Web page + API. |
| M3 — Interaction Console | ⚠️ Partial | POST /interactions exists; full console UI pending. |
| M4 — Case Management | ✅ Done | API + UI. |
| M5 — Workflow Engine | ✅ Done | Engine + 4 demo workflows + UI stepper. |
| M6 — Billing & Payments View | ✅ Done | Customer 360 billing tab + API. |
| M7 — Supervisor Dashboard | ✅ Done | UI + API. |
| M8 — Reporting & Metrics | ⚠️ Partial | ROI metrics done; full reporting pending. |
| M9 — Adapter Layer | ✅ Done | `packages/adapters/` + Siebel-like implementation. |
| M10 — Admin & Permissions | ⚠️ Partial | RBAC package done; API enforcement + admin UI pending. |
| M11 — AI Assistance | ❌ Pending | Not in this scaffold. |
| M12 — Pilot-Ready Version | ⚠️ Partial | Pilot playbook done; deployment guide pending. |
| M13 — Enterprise Migration Toolkit | ✅ Done | `packages/migration/` + dry-run + reconciliation. |

In addition, this scaffold ships three new milestones beyond the
original roadmap:

| New Milestone | Status |
|---|---|
| **M14 — Siebel-like Bridge + Fake Siebel Lab** | ✅ Done |
| **M15 — Legacy Observability** | ✅ Done |
| **M16 — ROI Metrics & Pilot Playbook** | ✅ Done |

---

## 3. Detailed milestones

### Milestone 0 — Repository Foundation ✅

- README, ROADMAP, CONTRIBUTING.
- All `docs/*` files (existing + new).
- `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`,
  `.env.example`, `.gitignore`.
- `vitest.config.ts`.

### Milestone 1 — Synthetic CRM Dataset ✅

- 24 residential + 8 business + 1 VIP customers.
- Accounts, contacts, contracts, services.
- Invoices, payments, debts.
- Cases, interactions, service orders.
- Knowledge articles, offers.
- Audit events.
- Fake Siebel dataset (accounts, contacts, SRs, assets, activities,
  orders, invoices).
- Migration scaffolding (source systems, registry, ID store, plan).
- ROI baseline numbers.

### Milestone 2 — Customer 360 ✅

- Search page with text + segment filter.
- 360 view: account, contact methods, services, billing, cases,
  timeline.
- External ID (legacy) shown when present.

### Milestone 3 — Interaction Console ⚠️

- POST /interactions endpoint.
- GET /interactions.
- Full console UI (start interaction → verify identity → choose reason
  → workflow → notes → close) is **pending**.

### Milestone 4 — Case Management ✅

- List + filters.
- Create case (POST /cases).
- Update case (PATCH /cases/:id).
- Audit events on create/update.

### Milestone 5 — Workflow Engine ✅

- 4 demo workflows: billing_claim, cancellation_retention,
  payment_promise, technical_complaint.
- Start, complete step, cancel run.
- Field validation.
- Workflow runs persisted in memory.

### Milestone 6 — Billing & Payments ✅

- Customer 360 billing tab.
- GET /customers/:id/billing.
- Invoices, payments, debts.
- Total due computation.

### Milestone 7 — Supervisor Dashboard ✅

- KPIs: open cases, escalations, customers, audit.
- Cases by status and by category.

### Milestone 8 — Reporting & Metrics ⚠️

- ROI metrics page done (before/after AHT, FCR, escalations, training,
  audit time, monthly savings).
- Advanced reporting (cases by category over time, operator
  productivity, workflow completion rate) **pending**.

### Milestone 9 — Adapter Layer ✅

- Vendor-neutral contracts: `CRMAdapter`, `BillingAdapter`,
  `TicketingAdapter`, `AuthAdapter`, `KnowledgeBaseAdapter`,
  `ObservabilityAdapter`.
- Error model: `AdapterError` with typed codes.
- `AdapterHealth` shape.

### Milestone 10 — Admin & Permissions ⚠️

- `packages/permissions/` ships RBAC for 8 roles and 13 permissions.
- `can(role, permission)` helper.
- API enforcement of permissions is **pending**.
- Admin UI (users, teams, queues, workflow configuration) is **pending**.

### Milestone 11 — AI Assistance ❌

- Not implemented.
- Planned: customer summary, case summary, suggested next step,
  knowledge article suggestion, draft note generation, AI audit event,
  manual confirmation before critical actions.

### Milestone 12 — Pilot-Ready Version ⚠️

- `docs/PILOT_PLAYBOOK_SIEBEL.md` done.
- `docs/ENTERPRISE_READINESS_GAP.md` done.
- Deployment documentation, environment configuration, audit export,
  data import template, basic observability — **pending**.

### Milestone 13 — Enterprise Migration Toolkit ✅

- `SourceOfTruthRegistry`.
- `EntityMapping` / `FieldMapping`.
- `IdMappingStore`.
- `MigrationPlan`.
- `createDryRunReport`.
- `detectConflicts`.
- `buildReconciliationReport`.
- `createRollbackPlan`.
- `ModuleMigrationStatus`.

### Milestone 14 — Siebel-like Bridge + Fake Siebel Lab ✅ (new)

- Siebel-like DTOs: Account, Contact, Service Request, Asset, Activity,
  Order, Business Object, Integration Object, Business Service.
- `SiebelBridge` contract implementing CRM/Billing/Auth/Metadata/
  Health/Business-Service-Invoker.
- `FakeSiebelAdapter` against in-memory data.
- `FakeSiebelSessionStore` with 30-minute TTL.
- `FakeSiebelErrorSimulator` with configurable failure rates.
- `FakeSiebelMetadataProvider`.
- Bidirectional mapping helpers (anti-corruption layer).

### Milestone 15 — Legacy Observability ✅ (new)

- `LegacyMetricsCollector` with latency, errors, counters.
- `MockSiebelMetricsCollector` with component health.
- `LegacySystemHealth`, `LegacyComponentStatus`, `IntegrationLatencyMetric`,
  `LegacyErrorEvent`.
- Separation from CRM operational metrics.

### Milestone 16 — ROI Metrics & Pilot Playbook ✅ (new)

- `docs/ROI_METRICS.md` template.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` with 6 stages.
- `docs/SELLING_TO_SIEBEL_CUSTOMERS.md` narrative.
- ROI calculation in `packages/demo-data/computeRoi()`.
- `/roi/demo` endpoint.
- ROI web page.

---

## 4. Long-Term Backlog

- Real Siebel REST adapter implementation.
- PostgreSQL persistence.
- SSO (OIDC/SAML).
- API RBAC enforcement.
- Admin UI.
- AI assistance (M11).
- Omnichannel inbox.
- Telephony/CTI integration.
- Advanced SLA engine.
- Field service coordination.
- Campaign management.
- Advanced retention engine.
- Advanced collections rules.
- Customer portal.
- Mobile supervisor view.
- Advanced analytics.
- Data warehouse connector.
- Plugin system.
- Multi-tenant support.
- Internationalization.
- White-label support.
- Open UI inspector (optional, see `docs/SIEBEL_OPENUI_RESEARCH.md`).
- Container image + Helm chart.
- Load / chaos / e2e testing.

---

## 5. Current Priority

The recommended immediate priority is:

1. Close the security gaps: SSO, API RBAC enforcement, secret management.
2. Add a real database (PostgreSQL recommended).
3. Implement a real Siebel REST adapter behind the existing bridge
   contract.
4. Add the full Interaction Console UI.
5. Add the Admin UI.
6. Add AI assistance (M11).
7. Add deployment artifacts (container image, Helm chart).
8. Run the first real pilot against a sandbox Siebel-like environment.

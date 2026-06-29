# Roadmap — LegacyOps Console

## 1. Roadmap Philosophy

LegacyOps Console should evolve from a synthetic but realistic CRM demo into a complete enterprise CRM with migration-ready architecture.

The roadmap is incremental, but the product ambition is complete.

The project should avoid two traps:

1. Building a generic CRUD system with no operational depth.
2. Promising enterprise replacement before the core product is proven.

Each milestone should produce something demonstrable, testable and useful for portfolio or pilot conversations.

---

## Milestone 0 — Repository Foundation

### Objective

Create a professional project foundation.

### Deliverables

- README.
- Product vision document.
- Architecture document.
- Migration strategy document.
- Demo scenarios document.
- Security notes.
- Contributing guide.
- Roadmap.
- Initial repository structure.
- License decision.

### Success Criteria

- The project is understandable from the repository alone.
- The scope is ambitious but credible.
- Legal and ethical boundaries are clear.
- The first implementation path is defined.

---

## Milestone 1 — Synthetic CRM Dataset

### Objective

Create realistic synthetic data for enterprise CRM workflows.

### Deliverables

- Fake customers.
- Fake accounts.
- Fake contracts.
- Fake services.
- Fake invoices.
- Fake payments.
- Fake cases.
- Fake interactions.
- Fake operators.
- Fake supervisors.
- Fake queues.
- Fake workflows.
- Fake audit events.

### Success Criteria

- Demo data feels realistic.
- No real customer data is used.
- Edge cases are included.
- Dataset supports all initial demo scenarios.

---

## Milestone 2 — Customer 360

### Objective

Build the first high-value CRM screen: a complete customer context view.

### Deliverables

- Customer search.
- Customer profile.
- Account summary.
- Contact methods.
- Product/service summary.
- Billing summary.
- Case list.
- Interaction timeline.
- Risk flags.
- Notes preview.

### Success Criteria

- Operator can understand a customer’s situation quickly.
- Important data is visible without excessive navigation.
- UI supports dense information without becoming confusing.

---

## Milestone 3 — Interaction Console

### Objective

Create the main operator workspace for handling customer interactions.

### Deliverables

- Start interaction.
- Verify identity.
- Select contact reason.
- Open guided workflow.
- Add notes.
- Link or create case.
- Close interaction.
- Generate audit events.

### Success Criteria

- Operator can complete an interaction from start to finish.
- Required steps are clear.
- Interaction is auditable.
- The workflow reduces cognitive load.

---

## Milestone 4 — Case Management

### Objective

Implement native case and ticket management.

### Deliverables

- Create case.
- View case.
- Edit case.
- Assign case.
- Change status.
- Add comments.
- Escalate case.
- Link case to customer/account/service.
- Track SLA fields.
- Create audit events.

### Success Criteria

- Cases have a clear lifecycle.
- Operators and supervisors can manage cases.
- Case updates are auditable.
- Basic SLA risk can be displayed.

---

## Milestone 5 — Workflow Engine

### Objective

Make guided workflows configurable and central to operations.

### Deliverables

- Workflow schema.
- Workflow step model.
- Required fields.
- Conditional branches.
- Validation rules.
- Workflow run state.
- Workflow audit events.
- UI stepper.
- Initial workflows:
  - Billing claim.
  - Cancellation retention.
  - Technical complaint.
  - Payment promise.

### Success Criteria

- Workflows guide the operator.
- Required information is captured.
- Workflow state is persisted.
- Workflow history is auditable.

---

## Milestone 6 — Billing and Payments View

### Objective

Add synthetic billing visibility and payment-related workflows.

### Deliverables

- Billing summary.
- Invoice list.
- Payment history.
- Debt status.
- Disputed invoice flag.
- Payment promise workflow.
- Billing claim workflow.
- Billing adapter interface.

### Success Criteria

- Operator can understand billing status quickly.
- Billing workflows can create linked cases.
- Billing data remains separated behind an adapter interface.

---

## Milestone 7 — Supervisor Dashboard

### Objective

Provide visibility for team leaders and supervisors.

### Deliverables

- Team activity summary.
- Open cases.
- Escalated cases.
- SLA risk.
- Operator productivity.
- Workflow completion rate.
- Common error patterns.
- Case reassignment.

### Success Criteria

- Supervisor can identify urgent issues.
- Team performance is visible.
- Escalations are actionable.
- Supervisor actions are auditable.

---

## Milestone 8 — Reporting and Metrics

### Objective

Measure operational improvement.

### Deliverables

- Cases by category.
- Average handling time.
- Workflow completion time.
- Screens/clicks per simulated workflow.
- Escalation rate.
- Data completeness.
- Operator performance.
- Before/after demo comparison.

### Success Criteria

- Demo can show measurable value.
- Metrics support a business case.
- Reports are useful for product validation and sales conversations.

---

## Milestone 9 — Adapter Layer

### Objective

Prepare the system for real-world integrations.

### Deliverables

- CRM adapter interface.
- Billing adapter interface.
- Ticketing adapter interface.
- Auth adapter interface.
- Demo adapter implementations.
- Mock legacy adapter.
- Error simulation.
- Adapter documentation.

### Success Criteria

- Core logic does not depend on one external system.
- Demo and integration modes can share the same internal contracts.
- External failures are handled safely.

---

## Milestone 10 — Admin and Permissions

### Objective

Add configurable access control and administration tools.

### Deliverables

- Users.
- Roles.
- Permissions.
- Teams.
- Queues.
- Workflow configuration.
- Business rule configuration.
- Audit visibility.
- Demo data management.

### Success Criteria

- Different roles have different capabilities.
- Sensitive actions require permissions.
- Admin changes are auditable.
- Basic enterprise governance is credible.

---

## Milestone 11 — AI Assistance

### Objective

Add optional AI assistance without weakening auditability.

### Deliverables

- Customer summary.
- Case summary.
- Suggested next step.
- Suggested knowledge article.
- Draft note generation.
- AI audit event.
- Manual confirmation before critical actions.

### Success Criteria

- AI improves operator speed.
- AI output is clearly labeled.
- AI suggestions are auditable.
- AI does not bypass business rules.

---

## Milestone 12 — Pilot-Ready Version

### Objective

Prepare the product for a controlled pilot.

### Deliverables

- Deployment documentation.
- Environment configuration.
- Security checklist.
- Audit export.
- Data import template.
- Basic observability.
- Error handling.
- Pilot metrics report template.
- Demo-to-pilot checklist.

### Success Criteria

- Product can be demonstrated credibly to a company.
- Pilot scope can be limited safely.
- Security and data boundaries are documented.
- Success metrics are defined.

---

## Milestone 13 — Enterprise Migration Toolkit

### Objective

Support progressive migration from external systems.

### Deliverables

- Data mapping templates.
- Import/export tools.
- Source-of-truth documentation.
- Integration health checks.
- Migration checklist.
- Rollback checklist.
- Module replacement guide.
- Audit reconciliation guide.

### Success Criteria

- Migration can be discussed concretely.
- Risks are visible.
- Replacement can happen module by module.
- The product supports enterprise adoption strategy.

---

## Long-Term Backlog

Potential future modules:

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

---

## Current Priority

The recommended immediate priority is:

1. Finalize documentation.
2. Create repository structure.
3. Choose stack.
4. Build synthetic dataset.
5. Build Customer 360.
6. Build Interaction Console.
7. Build first workflow: Billing Claim.

The first visible product should prove the main thesis:

> A complex CRM workflow can be made faster, clearer and easier to operate without removing enterprise-grade traceability.

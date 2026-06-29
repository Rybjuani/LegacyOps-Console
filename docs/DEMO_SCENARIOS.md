# Demo Scenarios — LegacyOps Console

## 1. Purpose

This document defines realistic synthetic demo scenarios for LegacyOps Console.

The objective is to demonstrate how the CRM handles complex customer operations through a clear, guided and auditable interface.

All scenarios must use synthetic data only. No real customer data, confidential workflows or proprietary company information should be used.

---

## 2. Demo Principles

Demo scenarios should be:

- Realistic.
- Legally safe.
- Based on generic enterprise operations.
- Easy to understand.
- Measurable.
- Useful for product validation.
- Useful for portfolio demonstration.
- Useful for future pilot conversations.

Each scenario should show:

1. Customer context.
2. Operator objective.
3. Required workflow.
4. Data needed.
5. Expected outcome.
6. Audit trail.
7. Success metrics.

---

## 3. Synthetic Demo Dataset

The demo dataset should include multiple customer profiles with different operational states.

### 3.1 Customer Types

Recommended synthetic customer types:

- Residential customer with active services.
- Business customer with multiple contracts.
- Customer with billing dispute.
- Customer with overdue debt.
- Customer with repeated technical complaints.
- Customer at risk of cancellation.
- Customer eligible for commercial offer.
- Customer with incomplete contact data.
- Customer with recently closed case.
- Customer with escalated case.

### 3.2 Operators

Synthetic operators:

- New operator.
- Experienced operator.
- Retention specialist.
- Collections agent.
- Back-office analyst.
- Supervisor.
- Administrator.

### 3.3 Queues

Synthetic queues:

- General support.
- Billing.
- Technical support.
- Retention.
- Collections.
- Back-office.
- Escalations.

### 3.4 Data Objects

The demo should include:

- Customers.
- Accounts.
- Contracts.
- Services.
- Invoices.
- Payments.
- Debt records.
- Cases.
- Interactions.
- Notes.
- Workflows.
- Audit events.
- Knowledge articles.
- Offers.
- Supervisor metrics.

---

## 4. Scenario 1 — Billing Claim

### 4.1 Summary

A customer calls because they believe their latest invoice is incorrect.

### 4.2 Customer Context

Synthetic customer:

- Name: Mariana López.
- Segment: Residential.
- Account status: Active.
- Services: Internet + mobile line.
- Billing status: Latest invoice disputed.
- Open cases: None.
- Risk flags: First billing complaint in 12 months.

### 4.3 Operator Goal

The operator must verify the customer, inspect billing history, identify the disputed invoice and create a billing claim case.

### 4.4 Workflow Steps

1. Search customer by document number or phone.
2. Open Customer 360.
3. Start interaction.
4. Verify identity.
5. Select reason: Billing claim.
6. Review latest invoice.
7. Compare previous invoices.
8. Select disputed invoice.
9. Capture claim reason.
10. Create case.
11. Assign priority.
12. Add customer-facing note.
13. Close interaction.
14. Generate audit events.

### 4.5 Required UI Elements

- Customer search.
- Identity verification panel.
- Billing summary.
- Invoice list.
- Case creation form.
- Workflow stepper.
- Notes field.
- Resolution confirmation.
- Audit event log.

### 4.6 Expected Outcome

- A billing claim case is created.
- The disputed invoice is linked.
- The interaction is closed.
- The customer receives a case number.
- Audit trail records all relevant actions.

### 4.7 Metrics

- Time to identify invoice.
- Time to create case.
- Number of screens used.
- Number of required fields completed.
- Data completeness rate.
- Audit completeness.

---

## 5. Scenario 2 — Cancellation and Retention

### 5.1 Summary

A customer wants to cancel a service due to price concerns.

### 5.2 Customer Context

Synthetic customer:

- Name: Diego Fernández.
- Segment: Residential.
- Account status: Active.
- Services: Internet premium.
- Billing status: Up to date.
- Open cases: None.
- Risk flags: High cancellation risk.
- Offer eligibility: Retention discount available.

### 5.3 Operator Goal

The operator must follow a retention workflow, review eligibility and register the customer’s final decision.

### 5.4 Workflow Steps

1. Search customer.
2. Open Customer 360.
3. Start interaction.
4. Verify identity.
5. Select reason: Cancellation request.
6. Review active services.
7. Check retention eligibility.
8. Show allowed retention offer.
9. Register customer response.
10. If accepted, create retention action.
11. If rejected, create cancellation follow-up.
12. Add commercial note.
13. Close interaction.
14. Generate audit events.

### 5.5 Expected Outcome

Possible outcomes:

- Customer accepts retention offer.
- Customer rejects offer and cancellation case is created.
- Customer requests follow-up.

### 5.6 Metrics

- Time to identify eligibility.
- Offer acceptance rate.
- Workflow completion rate.
- Operator decision accuracy.
- Escalation rate.

---

## 6. Scenario 3 — Debt and Payment Promise

### 6.1 Summary

A customer has overdue debt and calls to negotiate a payment date.

### 6.2 Customer Context

Synthetic customer:

- Name: Sofía Ramírez.
- Segment: Residential.
- Account status: Active with overdue balance.
- Services: Mobile line.
- Billing status: Two overdue invoices.
- Open cases: Collections follow-up.
- Risk flags: Medium collections risk.

### 6.3 Operator Goal

The operator must review debt, register a payment promise and schedule follow-up.

### 6.4 Workflow Steps

1. Search customer.
2. Open Customer 360.
3. Start interaction.
4. Verify identity.
5. Select reason: Payment promise.
6. Review overdue invoices.
7. Check existing collections case.
8. Capture promised payment date.
9. Capture promised amount.
10. Validate allowed payment window.
11. Update collections status.
12. Schedule follow-up.
13. Add compliance note.
14. Close interaction.
15. Generate audit events.

### 6.5 Expected Outcome

- Payment promise is registered.
- Collections case is updated.
- Follow-up task is created.
- Audit log captures the agreement.

### 6.6 Metrics

- Data completeness.
- Promise registration time.
- Invalid promise prevention.
- Follow-up scheduling accuracy.
- Audit completeness.

---

## 7. Scenario 4 — Technical Complaint

### 7.1 Summary

A customer reports recurring service failure.

### 7.2 Customer Context

Synthetic customer:

- Name: Carlos Méndez.
- Segment: Residential.
- Account status: Active.
- Services: Internet.
- Technical status: Intermittent failures.
- Open cases: One previous technical case.
- Risk flags: Repeated complaint.

### 7.3 Operator Goal

The operator must review service status, link the new complaint to the affected service and create or escalate a technical case.

### 7.4 Workflow Steps

1. Search customer.
2. Open Customer 360.
3. Start interaction.
4. Verify identity.
5. Select reason: Technical complaint.
6. Review service status.
7. Review previous technical cases.
8. Capture problem description.
9. Select affected service.
10. Determine whether escalation is required.
11. Create or update technical case.
12. Link case to service.
13. Add internal note.
14. Close interaction.
15. Generate audit events.

### 7.5 Expected Outcome

- Technical case is created or updated.
- Affected service is linked.
- Escalation is triggered if required.
- Customer receives clear next steps.

### 7.6 Metrics

- Time to service context.
- Duplicate case prevention.
- Escalation accuracy.
- Case completeness.
- Operator notes quality.

---

## 8. Scenario 5 — New Operator Guided Training

### 8.1 Summary

A new operator must complete common workflows with minimal training.

### 8.2 Operator Context

Synthetic operator:

- Name: Lucas Pérez.
- Role: New customer service operator.
- Training status: Basic onboarding only.
- Permissions: General support.

### 8.3 Goal

Demonstrate that the UI and workflows guide a new operator through basic scenarios without requiring deep system knowledge.

### 8.4 Workflow Steps

The operator should complete:

1. Customer search.
2. Identity verification.
3. Customer 360 review.
4. Billing claim.
5. Basic case creation.
6. Interaction closure.

### 8.5 Expected Outcome

- New operator completes workflows successfully.
- Required fields are not missed.
- System guidance reduces uncertainty.
- Supervisor can review performance.

### 8.6 Metrics

- Time to complete first case.
- Number of help prompts needed.
- Number of validation errors.
- Completion rate.
- Supervisor correction count.

---

## 9. Scenario 6 — Supervisor Escalation Review

### 9.1 Summary

A supervisor reviews escalated cases and identifies workflow bottlenecks.

### 9.2 Supervisor Context

Synthetic supervisor:

- Name: Laura Torres.
- Team: Customer Support.
- Queues: Billing, Technical, Retention.
- Responsibility: Monitor escalations and SLA risks.

### 9.3 Goal

The supervisor must identify urgent cases, review team performance and take action on high-risk items.

### 9.4 Workflow Steps

1. Open supervisor dashboard.
2. Review active cases.
3. Filter by SLA risk.
4. Open escalated case.
5. Review case timeline.
6. Review operator notes.
7. Reassign case if needed.
8. Add supervisor note.
9. Mark case as reviewed.
10. Generate audit events.

### 9.5 Expected Outcome

- SLA-risk cases are identified.
- Escalated case is reassigned or confirmed.
- Supervisor action is audited.
- Dashboard metrics update.

### 9.6 Metrics

- Time to identify SLA risk.
- Number of escalated cases reviewed.
- Reassignment accuracy.
- Supervisor review time.

---

## 10. Scenario 7 — Incomplete Customer Data

### 10.1 Summary

A customer profile has missing contact information.

### 10.2 Customer Context

Synthetic customer:

- Name: Valentina Castro.
- Segment: Residential.
- Account status: Active.
- Missing data: Email address.
- Contact risk: Invalid secondary phone.
- Open cases: None.

### 10.3 Goal

The operator must update customer contact data safely and with auditability.

### 10.4 Workflow Steps

1. Search customer.
2. Open Customer 360.
3. Start interaction.
4. Verify identity.
5. System highlights incomplete profile.
6. Operator updates email.
7. Operator updates secondary phone.
8. System validates format.
9. Operator confirms changes.
10. Audit event is generated.
11. Close interaction.

### 10.5 Expected Outcome

- Contact data is updated.
- Invalid data is rejected.
- Changes are auditable.
- Customer profile completeness improves.

### 10.6 Metrics

- Data validation accuracy.
- Profile completeness.
- Time to update data.
- Audit completeness.

---

## 11. Scenario 8 — Knowledge Base Suggestion

### 11.1 Summary

An operator handles a technical complaint and receives suggested knowledge base articles.

### 11.2 Goal

Demonstrate contextual assistance without replacing operator judgment.

### 11.3 Workflow Steps

1. Open technical complaint workflow.
2. Capture affected service.
3. Capture symptom.
4. System suggests relevant article.
5. Operator opens article.
6. Operator follows troubleshooting steps.
7. Operator records outcome.
8. Case is created or resolved.

### 11.4 Expected Outcome

- Suggested article helps reduce resolution time.
- Article usage is logged.
- Operator remains in control.

### 11.5 Metrics

- Article usefulness.
- Time to resolution.
- First contact resolution.
- Knowledge article usage rate.

---

## 12. Demo Comparison: Legacy vs LegacyOps

Each major scenario should include a comparison table.

Example:

| Metric | Simulated Legacy Flow | LegacyOps Flow |
|---|---:|---:|
| Screens used | 8 | 3 |
| Clicks | 45 | 16 |
| Required fields missed | 2 | 0 |
| Time to create case | 5 min | 2 min |
| Audit completeness | Partial | Complete |

The values should be synthetic but plausible and clearly marked as demo estimates.

---

## 13. Demo Requirements

Each demo scenario should include:

- Synthetic customer data.
- Synthetic account data.
- Workflow definition.
- Expected UI path.
- Expected audit events.
- Success metrics.
- Possible edge cases.
- Supervisor review path if relevant.

---

## 14. Edge Cases to Include

The synthetic demo should include edge cases such as:

- Customer not found.
- Duplicate customer records.
- Identity verification failed.
- Invoice not available.
- External adapter timeout.
- Permission denied.
- Case already exists.
- SLA already breached.
- Workflow step skipped.
- Invalid payment promise date.
- Missing required field.
- AI suggestion rejected by operator.

---

## 15. Final Demo Goal

The final demo should prove that LegacyOps Console can handle realistic CRM complexity through a more intuitive, guided and auditable operational experience.

The demo should not only look modern. It should show measurable operational improvement.

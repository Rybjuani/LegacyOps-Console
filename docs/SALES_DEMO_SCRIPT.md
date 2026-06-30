# Sales Demo Script — LegacyOps Console

> A 30-minute demo flow for a Siebel-like customer. The goal is to prove
> that LegacyOps is NOT a generic CRM and that there is a credible path
> from demo to pilot to partial replacement.

---

## 0. Pre-demo (5 minutes before the call)

- Start `pnpm dev:api` and `pnpm dev:web` locally.
- Verify the dashboard loads.
- Verify Customer Search returns results.
- Verify the Interaction Console can complete a full flow.
- Verify the Siebel Bridge Lab can invoke a business service.
- Verify the Migration Dry Run returns conflicts.
- Verify the ROI calculator accepts custom inputs.
- Have `docs/LEGACYOPS_VS_LEGACY_CRM.md` open in a browser tab.

---

## 1. Opening (2 minutes)

> "LegacyOps Console is a CRM modernization platform. We do not ask you
> to rip out Siebel. We reduce operational friction now, measure the
> savings, and migrate modules one at a time — safely, auditably,
> reversibly."

Show the README's "Why LegacyOps exists" section. Mention the four
pillars: CRM core + Siebel-like bridge + migration engine + legacy
observability.

---

## 2. Dashboard (2 minutes)

- Show the operational dashboard.
- Highlight that customers, cases, workflows and audit are all native to LegacyOps.
- Point at the "What makes LegacyOps different" panel.

---

## 3. Customer 360 (4 minutes)

- Search for a customer.
- Open Customer 360.
- Show the source-of-truth badges (LegacyOps native, Fake Siebel Lab, Billing mock, Migration-mapped).
- Explain that in a real pilot, the Fake Siebel Lab badges become "Siebel" badges — the same UI works against real data.

---

## 4. Interaction Console (5 minutes)

- Open the Interaction Console.
- Run the full 7-step flow:
  1. Select customer.
  2. Verify identity.
  3. Choose reason.
  4. Run a workflow (e.g. billing_claim).
  5. Create a case.
  6. Add a note.
  7. Close the interaction.
- Show the audit summary at the bottom — every step was audited.

> "Every action the operator took is in the audit log. In a real pilot,
> this audit log is append-only and exported to your SIEM."

---

## 5. Case Management (3 minutes)

- Open Cases.
- Open the case created in step 4.
- Add a comment.
- Assign the case to a queue.
- Escalate the case — show the priority bumps.

> "Comments, assignments and escalations all produce audit events. The
> case lifecycle is enforced by the domain — operators cannot skip
> states."

---

## 6. Siebel Bridge Lab (4 minutes)

- Open the Siebel Bridge Lab.
- Show Business Objects, Integration Objects, Business Services.
- Invoke a business service: `LegacyOps Customer BS` → `GetCustomer`.
- Show the result.

> "This is the anti-corruption layer. The LegacyOps domain never sees
> Siebel types. The bridge translates DTOs in both directions. In a real
> pilot, this same UI talks to your Siebel REST endpoint."

---

## 7. Migration Dry Run (4 minutes)

- Open Migration Dry Run.
- Show the plan and the field mapping.
- Click "Run dry-run".
- Show the conflicts.
- Show the reconciliation report.
- Show the rollback plan preview.

> "Every migration step has a dry-run, conflict detection, reconciliation
> and rollback. We never migrate a module without a tested rollback
> plan."

---

## 8. Source of Truth Map (2 minutes)

- Open Source of Truth.
- Show the per-module ownership rules.
- Show the module migration status.

> "For each module, we decide who owns the truth. Some fields stay on
> Siebel, some move to LegacyOps, some are merged. The registry drives
> the anti-corruption layer."

---

## 9. Legacy Observability (2 minutes)

- Open Legacy Observability.
- Show component health, adapter latency, recent errors.
- Mention the Prometheus endpoint at `/legacy/metrics/prometheus`.

> "Legacy observability is separated from operational CRM metrics. A
> legacy outage does not show up as a CRM KPI regression."

---

## 10. ROI Metrics (2 minutes)

- Open ROI Metrics.
- Show the before/after table.
- Use `POST /roi/calculate` with the customer's own numbers (operator count, AHT, hourly cost).
- Show the monthly and annual savings.

> "These are conservative numbers. The same template is shipped to
> pilots — we plug in your numbers, not ours."

---

## 11. Closing (2 minutes)

- Show `docs/LEGACYOPS_VS_LEGACY_CRM.md`.
- Show `docs/PILOT_PLAYBOOK_SIEBEL.md`.
- Show the 5 enterprise issues (#1 SSO, #2 PostgreSQL, #3 durable audit, #4 real Siebel adapter, #5 container image).
- Propose the next step: a stage-1 synthetic demo with the customer's operations team.

> "We are honest about what is and is not production-ready. The pilot
> playbook is the path from this demo to a controlled engagement. We are
> not asking you to rip out Siebel — we are asking you to measure the
> savings first."

---

## 12. Objections and responses

| Objection | Response |
|---|---|
| "This is just another CRM." | Show the Siebel Bridge Lab, the migration dry-run and the source-of-truth map. A generic CRM does not have these. |
| "We can't rip out Siebel." | We agree. The first stage is read-only. |
| "Open UI is enough." | Open UI is client-side. LegacyOps owns the domain, audit, workflows and migration. |
| "Migration is too risky." | Every step has dry-run, conflict detection, reconciliation, rollback. One module at a time. |
| "How do we know the savings are real?" | The ROI template is the same in the demo and the pilot. We plug in your numbers. |
| "Is this production-ready?" | No. The Enterprise Readiness Gap document is honest. The pilot is a partnership. |

---

## 13. Reference

- `docs/MVP_DEFINITION.md`
- `docs/ENTERPRISE_PILOT_CHECKLIST.md`
- `docs/SELLING_TO_SIEBEL_CUSTOMERS.md`
- `docs/LEGACYOPS_VS_LEGACY_CRM.md`

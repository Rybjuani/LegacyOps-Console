# Enterprise Pilot Checklist — LegacyOps Console

> Step-by-step checklist to take LegacyOps from a demo to a controlled
> pilot with a real Siebel-like customer. Companion to
> `docs/PILOT_PLAYBOOK_SIEBEL.md`.

---

## 1. Pre-pilot (must be true before signing a pilot)

- [ ] Customer has identified a sandbox Siebel-like environment (not production).
- [ ] Customer has a service account with read-only permissions on the sandbox.
- [ ] Customer has signed an NDA and a pilot agreement.
- [ ] Customer has named an operations sponsor, an IT sponsor and an audit/compliance sponsor.
- [ ] LegacyOps team has reviewed `docs/ENTERPRISE_READINESS_GAP.md` with the customer.
- [ ] LegacyOps team has presented the ROI model with the customer's own numbers.
- [ ] Pilot scope is documented: which module, which queue, which KPIs, which duration.
- [ ] Rollback plan is documented and signed off by IT.
- [ ] Success criteria are documented and signed off by operations.

---

## 2. Stage 1 — Synthetic demo (week 0)

- [ ] Run LegacyOps in synthetic mode against the Fake Siebel Lab.
- [ ] Walk the customer through the 11-step MVP demo flow (`docs/MVP_DEFINITION.md`).
- [ ] Capture customer-specific KPI baselines (AHT, FCR, escalations, training, audit time).
- [ ] Capture the customer's pilot scope document.
- [ ] Get sign-off to proceed to stage 2.

---

## 3. Stage 2 — Read-only overlay (weeks 1–2)

- [ ] Implement the real Siebel REST adapter behind the `SiebelBridge` contract (issue #4).
- [ ] Configure LegacyOps to point at the sandbox.
- [ ] Verify `siebel.health()` returns `up` for the sandbox.
- [ ] Verify read-only endpoints return real sandbox data.
- [ ] Verify no write-back is configured.
- [ ] Run smoke tests against the sandbox.
- [ ] Train operators on Customer 360.
- [ ] Capture operator feedback daily.
- [ ] Verify audit log records every customer view.

---

## 4. Stage 3 — Workflow wrapper (weeks 3–4)

- [ ] Pick one workflow (e.g. `billing_claim`).
- [ ] Configure the workflow to wrap the legacy system (legacy remains source of truth).
- [ ] Train operators on the Workflow Stepper.
- [ ] Measure AHT, FCR, escalations for the wrapped workflow.
- [ ] Compare against baseline.
- [ ] Verify audit log records every workflow step.

---

## 5. Stage 4 — Controlled write-back (weeks 5–6)

- [ ] Enable write-back for the chosen module through the Siebel bridge.
- [ ] Configure conflict detection on write-back.
- [ ] Run a dry-run of the first write-back batch.
- [ ] Resolve any conflicts.
- [ ] Execute the write-back.
- [ ] Verify the legacy system received the writes.
- [ ] Update the source-of-truth registry to `fallback` for the migrated module.
- [ ] Verify audit log records every write-back.

---

## 6. Stage 5 — Partial replacement (weeks 7–8)

- [ ] Run the migration engine dry-run for the chosen module.
- [ ] Resolve all conflicts.
- [ ] Switch the module to `dual_write`.
- [ ] Verify both LegacyOps and the legacy system can write.
- [ ] Switch the module to `cut_over` (LegacyOps is primary).
- [ ] Keep the legacy system available for fallback.
- [ ] Monitor for 1 week.
- [ ] If stable, retire the legacy module (set status to `retired_legacy`).

---

## 7. Stage 6 — Metrics before/after (week 9)

- [ ] Compute ROI using the customer's actual numbers.
- [ ] Compare against the baseline captured in stage 1.
- [ ] Generate the pilot report.
- [ ] Present to the buyer committee.
- [ ] Get sign-off for production rollout (or extended pilot).

---

## 8. Security checklist (must be true throughout)

- [ ] No production data in synthetic mode.
- [ ] Sandbox service account is read-only for stages 2–3.
- [ ] Write-back service account has minimum privileges for stages 4–5.
- [ ] Tokens rotate at least every 30 minutes.
- [ ] Audit log is exported daily to a customer-controlled location.
- [ ] No secrets in the repository.
- [ ] CORS is restricted to the operator browser origin.
- [ ] TLS termination is enforced by the reverse proxy.

---

## 9. Rollback checklist (must be ready at every stage)

- [ ] Rollback plan is documented per stage.
- [ ] Rollback plan has been tested in sandbox.
- [ ] A rollback drill is scheduled before stage 4.
- [ ] The source-of-truth registry can be reverted in <5 minutes.
- [ ] The legacy system can be reactivated as primary in <15 minutes.

---

## 10. Exit criteria

The pilot is successful if ALL of the following are true:

- [ ] AHT reduction ≥ 20% on the migrated workflow.
- [ ] FCR uplift ≥ 10 percentage points.
- [ ] Escalation rate drop ≥ 5 percentage points.
- [ ] Audit time reduction ≥ 50%.
- [ ] Operator satisfaction ≥ 4/5.
- [ ] Zero data loss.
- [ ] Zero security incidents.
- [ ] 100% of operator actions audited.
- [ ] Rollback plan tested at least once.
- [ ] ROI report signed by operations, IT and audit.

---

## 11. Reference

- `docs/PILOT_PLAYBOOK_SIEBEL.md`
- `docs/ENTERPRISE_READINESS_GAP.md`
- `docs/SIEBEL_MODERNIZATION_ROI_MODEL.md`
- `docs/SALES_DEMO_SCRIPT.md`

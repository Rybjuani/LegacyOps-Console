# Pilot Playbook — Siebel-like Modernization

> How to run a controlled LegacyOps Console pilot in a real company that
> operates a Siebel-like CRM.

---

## 1. Pilot philosophy

A pilot is **not** a product demo. A pilot is a **controlled, time-boxed,
measurable** engagement where LegacyOps proves it can reduce operational
friction without breaking the legacy system.

Pilot rules:

- Read-only first. Write-back last.
- Always rollback-ready.
- Always audited.
- Always measured before/after.

---

## 2. Pilot stages

### Stage 1 — Synthetic demo (week 0)

- Run LegacyOps in synthetic mode against the Fake Siebel Lab.
- Show Customer 360, Interaction Console, Workflow Stepper, Migration
  Dry Run, ROI Metrics.
- Align on pilot scope, success metrics and security boundaries.

### Stage 2 — Read-only overlay (weeks 1–2)

- Connect LegacyOps to a **sandbox** Siebel-like environment through the
  bridge contract.
- Mode: `read_only_overlay`.
- Switch the adapter from `fake` to `real` by setting
  `LEGACYOPS_SIEBEL_ADAPTER=real` plus a valid `RealSiebelConfig` (see
  `docs/REAL_SIEBEL_ADAPTER.md` and `docs/SIEBEL_SANDBOX_ONBOARDING.md`).
- Confirm the endpoint map matches the sandbox's actual REST paths
  (the defaults are CONCEPTUAL — each customer must review and override).
- Verify `GET /siebel/adapter/status` returns `mode: real`,
  `realConfigured: true`.
- Operators see real legacy data through LegacyOps UI.
- No writes go to the legacy system from LegacyOps.
- Audit every customer view.

### Stage 3 — Workflow wrapper (weeks 3–4)

- Run a single workflow (e.g. `billing_claim`) end-to-end inside
  LegacyOps.
- Mode: `workflow_wrapper`.
- Legacy system remains source of truth.
- Audit and SLA are owned by LegacyOps.
- Measure AHT, FCR, escalation rate.

### Stage 4 — Controlled write-back (weeks 5–6)

- Enable write-back for one low-risk module (e.g. `case.billing_claim`).
- Mode: `controlled_write_back`.
- Every write goes through conflict detection.
- Source-of-truth registry updated to `fallback` for the migrated module.

### Stage 5 — Partial replacement (weeks 7–8)

- Migrate one module to `dual_write` then `cut_over`.
- Use the migration engine: dry-run, conflicts, reconciliation,
  rollback-ready.
- Legacy system remains available for fallback during cut-over.

### Stage 6 — Metrics before/after (week 9)

- Compute ROI using the template in `docs/ROI_METRICS.md`.
- Compare AHT, FCR, escalation rate, training time, audit time.
- Present results to the buyer committee.

---

## 3. Security requirements

- **No production data in synthetic mode.** Synthetic mode uses the Fake
  Siebel Lab only.
- **Sandbox first.** The first real connection must be to a sandbox, not
  to production.
- **Read-only service account.** For stages 2 and 3, the LegacyOps
  service account must have read-only permissions on the legacy system.
- **Write-back audit.** Every write-back operation must produce both an
  audit event and a legacy-side trace.
- **Token rotation.** Session tokens must rotate at least every 30
  minutes. The Fake Siebel Lab already enforces this.
- **Network isolation.** The LegacyOps adapter must call the legacy
  system only through a documented endpoint, never directly from the
  browser.

---

## 4. Rollback plan

Before each stage, prepare a rollback plan:

1. **Read-only overlay** — disable the adapter; no data was changed.
2. **Workflow wrapper** — switch the workflow back to legacy-only.
3. **Controlled write-back** — switch the module back to read-only.
4. **Partial replacement** — re-enable the legacy system as primary
   using the `SourceOfTruthRegistry`. The migration engine's
   `RollbackPlan` documents the steps.

Rollback must be tested in sandbox before the pilot moves to the next
stage.

---

## 5. Success criteria

A pilot is successful if **all** of the following are true:

| Criterion | Target |
|---|---|
| AHT reduction | ≥ 20% on the migrated workflow |
| FCR uplift | ≥ 10 percentage points |
| Escalation rate drop | ≥ 5 percentage points |
| Audit time reduction | ≥ 50% |
| Operator satisfaction | ≥ 4/5 average |
| Zero data loss | No rollback triggered for data reasons |
| Zero security incidents | None |
| Audit completeness | 100% of operator actions audited |

---

## 6. Buyer committee checklist

Before the pilot moves to production:

- [ ] Security review passed.
- [ ] Compliance review passed.
- [ ] Rollback plan tested in sandbox.
- [ ] ROI measured and presented.
- [ ] Pilot report signed by operations, IT, audit.
- [ ] Production rollout plan approved.
- [ ] Pilot learnings fed back into the roadmap.

---

## 7. Anti-patterns

- ❌ Skipping read-only stage.
- ❌ Migrating more than one module at a time.
- ❌ Disabling audit to “speed things up”.
- ❌ Mixing pilot data with production data.
- ❌ Picking a high-risk module (e.g. billing write-off) for the first
  write-back.

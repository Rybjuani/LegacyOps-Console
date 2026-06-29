# Selling to Siebel Customers

> Narrative for commercial conversations with companies that operate
> Siebel-like CRMs. Honest, layered, ROI-anchored. No “we shut down
> Siebel tomorrow” claims.

---

## 1. Core narrative

> “We don’t ask you to rip out Siebel. We reduce operational friction
> now, measure the savings, and then migrate modules one at a time —
> safely, auditably, reversibly.”

That sentence is the whole pitch. Everything else is evidence.

---

## 2. The five-step commercial path

1. **Reduce friction now.** Deploy LegacyOps as a read-only overlay.
   Operators see a modern Customer 360 on top of legacy data. No
   writes, no risk.
2. **Measure savings.** Use the ROI template (`docs/ROI_METRICS.md`) to
   measure AHT, FCR, escalation, training time and audit time before
   and after the overlay.
3. **Replace low-risk modules.** Pick one workflow (e.g. billing claim).
   Run it inside LegacyOps with the legacy system as fallback. Measure
   again.
4. **Migrate gradually.** Use the migration engine to dual-write, then
   cut over one module at a time. Each migration has a dry-run, a
   conflict report, a reconciliation report and a rollback plan.
5. **Retire legacy per module.** Once a module is fully migrated and
   reconciled, the legacy system can be retired for that module. No
   big-bang.

---

## 3. Buyer personas

| Persona | What they care about | What to show them |
|---|---|---|
| Operations director | AHT, FCR, escalation, audit time | Supervisor dashboard, ROI Metrics page |
| IT director | Integration modes, security, rollback | Siebel Bridge Lab, Migration Dry Run, Source of Truth Map |
| Call center manager | Operator productivity, training time | Customer 360, Workflow Stepper |
| Digital transformation lead | Modernization roadmap, pilot path | Pilot Playbook, Integration Modes page |
| Supervisor / team lead | Real-time visibility, escalations | Supervisor Dashboard, Legacy Observability |
| Auditor / compliance | Audit trail, source-of-truth | Audit Events, Source of Truth Map |

---

## 4. Objections and responses

| Objection | Response |
|---|---|
| “This is just another CRM.” | Show the Siebel Bridge Lab, the migration dry-run and the source-of-truth map. A generic CRM does not have these. |
| “We can’t rip out Siebel.” | We agree. LegacyOps is a coexistence and progressive migration platform. The first stage is read-only. |
| “Open UI is enough.” | Open UI is client-side customisation. It does not give you a modern CRM core, audit, workflows, or migration. |
| “We already have a Prometheus exporter.” | Good — LegacyOps integrates with it through the observability adapter. We add adapter-level latency, conflict metrics and operational/legacy separation. |
| “Migration is too risky.” | Every migration step has a dry-run, conflict detection, reconciliation and rollback. We migrate one module at a time, with the legacy system as fallback. |
| “How do we know the savings are real?” | The ROI template is the same in the demo and in the pilot. We plug in your numbers, not ours. |
| “Who else uses this?” | LegacyOps is a new open-source platform. The first pilot is a partnership, not a vendor sale. |
| “Is this production-ready?” | No, not yet. The scaffold ships synthetic data and a Fake Siebel Lab. The Enterprise Readiness Gap document is honest about what is missing. |

---

## 5. Pilot pricing philosophy (informational)

- Pilot: fixed-fee, time-boxed (8–10 weeks), success-criteria-based.
- Production: per-seat operator pricing + integration support tier.
- Migration projects: scoped per module.

These are illustrative; commercial terms are defined outside the
repository.

---

## 6. What we never claim

- ❌ “Replace Siebel in a weekend.”
- ❌ “No integration needed.”
- ❌ “100% production-ready today.”
- ❌ “Better than Siebel in every way.”
- ❌ “No pilot required.”

Honesty is a feature. It is what makes LegacyOps defensible to an
auditor.

---

## 7. Reference assets for sales conversations

- `docs/ROI_METRICS.md` — ROI template.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/LEGACYOPS_VS_LEGACY_CRM.md` — comparison.
- `docs/ENTERPRISE_READINESS_GAP.md` — honest gap analysis.
- `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md` — public ecosystem audit.
- The live demo (Dashboard → Customer 360 → Workflow Stepper → Siebel
  Bridge Lab → Migration Dry Run → ROI).

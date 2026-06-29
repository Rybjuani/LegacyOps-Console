# LegacyOps vs Legacy CRM

> Why LegacyOps Console is sellable to companies that operate a Siebel-like
> CRM — and why it is not “just another modern CRM”.

---

## 1. Four categories compared

| Category | Description | Pros | Cons |
|---|---|---|---|
| **Legacy CRM (Siebel-like)** | The current system. Decades of customisation, deeply integrated. | Stable, paid for, deeply integrated. | Hard to operate, slow to change, expensive to extend, hard to hire for. |
| **UI wrapper** | A modern UI put on top of the legacy system. | Fast to deploy, looks modern. | Does not fix the underlying model; brittle; no audit; no migration path. |
| **Isolated modern CRM** | A new CRM deployed in parallel, no legacy integration. | Modern UX, fast to build. | Legacy still runs critical flows; duplication; no migration strategy; eventually abandoned. |
| **LegacyOps Console** | A CRM modernization platform: own CRM core + Siebel-like bridge + ACL + migration engine + legacy observability. | Modern UX, owns its domain, integrates with legacy through an ACL, migrates module by module, measures ROI. | Requires investment in pilot; first versions are synthetic; needs real adapter work for production. |

---

## 2. Why LegacyOps is sellable to Siebel customers

1. **It reduces friction now, without forcing a rip-and-replace.** The
   first pilot stage is read-only. Operators see a modern Customer 360
   on top of legacy data. No risk.
2. **It measures savings.** The ROI template is shipped with the product.
   AHT, FCR, escalation, training, audit time — before and after.
3. **It migrates gradually.** One module at a time, with dry-run,
   conflict detection, reconciliation and rollback. The legacy system
   stays as fallback during cut-over.
4. **It creates ROI evidence.** Every pilot produces a concrete ROI
   report that can be presented to a buyer committee.
5. **It is auditable.** Every operator action produces an audit event.
   Every adapter call is recorded. Every migration step is traceable.
6. **It is honest.** `docs/ENTERPRISE_READINESS_GAP.md` documents what
   is and is not production-ready. No false claims.

---

## 3. Typical comparison points

| Capability | Legacy CRM | UI wrapper | Isolated modern CRM | LegacyOps |
|---|---|---|---|---|
| Modern UX | ❌ | ✅ | ✅ | ✅ |
| Own CRM domain | ❌ | ❌ | ✅ | ✅ |
| Siebel-like bridge | ❌ | partial | ❌ | ✅ |
| Anti-corruption layer | ❌ | ❌ | ❌ | ✅ |
| Migration engine | ❌ | ❌ | ❌ | ✅ |
| Legacy observability | partial | ❌ | ❌ | ✅ |
| Audit trail | partial | ❌ | partial | ✅ |
| Workflow engine | partial | ❌ | partial | ✅ |
| Pilot playbook | ❌ | ❌ | ❌ | ✅ |
| ROI template | ❌ | ❌ | ❌ | ✅ |

---

## 4. The “just another CRM” objection

The single most common objection from a Siebel customer is:

> “This looks like just another modern CRM with no real relationship to
> Siebel.”

LegacyOps answers from code, structure and documentation:

- `packages/siebel-bridge/` — an explicit Siebel-like bridge with
  Business Objects, Business Components, Integration Objects and
  Business Services as conceptual DTOs.
- `packages/siebel-bridge/src/mapping/` — bidirectional mapping helpers
  (the anti-corruption layer).
- `packages/migration/` — source-of-truth registry, entity/field
  mapping, ID mapping store, dry-run, conflict detection,
  reconciliation, rollback.
- `packages/legacy-observability/` — health, latency and error metrics
  for the adapter layer, separated from CRM operational metrics.
- `docs/SIEBEL_COMPATIBILITY_STRATEGY.md`,
  `docs/SIEBEL_OBJECT_MAPPING.md`, `docs/SIEBEL_OBSERVABILITY_STRATEGY.md`,
  `docs/PILOT_PLAYBOOK_SIEBEL.md`, `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md`.

A generic modern CRM does not ship any of these.

---

## 5. Why this matters commercially

A Siebel customer has three real options:

1. **Keep Siebel.** Operational friction continues. Cost grows.
2. **Buy a modern CRM in parallel.** Legacy still runs critical flows.
   Total cost doubles.
3. **Modernize progressively with LegacyOps.** Reduce friction now,
   measure savings, migrate module by module, retire legacy per module.

LegacyOps is the only option that combines modern UX, a real CRM core, a
migration path and ROI evidence in one platform.

---

## 6. Reference

- `docs/PRODUCT_VISION.md` — product vision.
- `docs/ARCHITECTURE.md` — architecture.
- `docs/SELLING_TO_SIEBEL_CUSTOMERS.md` — sales narrative.
- `docs/ROI_METRICS.md` — ROI template.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/ENTERPRISE_READINESS_GAP.md` — honest gap analysis.

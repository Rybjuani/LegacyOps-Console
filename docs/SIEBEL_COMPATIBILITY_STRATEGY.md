# Siebel-like Compatibility Strategy

> How LegacyOps Console integrates with environments that look like Oracle
> Siebel CRM — without copying proprietary schemas, without depending on
> private endpoints, and without making false production claims.

---

## 1. Positioning

LegacyOps Console is **not** a Siebel clone. It is **not** a Siebel Open UI
extension. It is **not** a wrapper that hides Siebel behind a thin UI.

LegacyOps Console is a **CRM modernization platform** that ships its own
CRM core and is designed to **coexist, integrate with and progressively
replace** Siebel-like legacy CRMs.

The commercial goal is **modernization, coexistence and progressive
migration** — not a risky big-bang replacement.

---

## 2. What “Siebel-like” means in LegacyOps

LegacyOps models **conceptual Siebel-like types**:

- **Business Object** — a named aggregate (e.g. `Account`, `Contact`,
  `Service Request`).
- **Business Component** — a typed view inside a business object.
- **Integration Object** — a serialisable DTO used for inbound/outbound
  integration.
- **Business Service** — a named service with methods that can be invoked
  from outside the legacy system.

These types live in `packages/siebel-bridge/src/contracts/types.ts` and
are intentionally generic. No proprietary schema is reproduced.

The LegacyOps core domain does **not** depend on these types. The
**anti-corruption layer** (see `docs/ANTI_CORRUPTION_LAYER.md`) translates
between them.

---

## 3. Integration seams

LegacyOps speaks to Siebel-like environments through the documented public
seams:

| Seam | Use |
|------|-----|
| Siebel REST API | Read/write business components, invoke business services, fetch integration objects. |
| SOAP / EAI (conceptual) | For older deployments where REST is not enabled. Modeled as an adapter contract, not implemented in the scaffold. |
| Integration Objects | Inbound/outbound DTOs. LegacyOps exposes its own DTOs and maps them to/from integration objects. |
| Business Services | Invokable from outside the legacy system. LegacyOps wraps them through `SiebelBusinessServiceInvoker`. |
| Open UI (optional, future) | A future “legacy UI inspector” could read Open UI navigation context. Not a runtime dependency. See `docs/SIEBEL_OPENUI_RESEARCH.md`. |

The exact transport (REST, SOAP, EAI) is an adapter implementation
concern. The LegacyOps domain only sees the `CRMAdapter`,
`BillingAdapter`, `TicketingAdapter`, `AuthAdapter`,
`KnowledgeBaseAdapter`, `ObservabilityAdapter` contracts.

---

## 4. Configuration, not hardcoding

Every Siebel-like connection parameter lives in `.env`:

```text
SIEBEL_BASE_URL=http://localhost:9443/siebel
SIEBEL_USERNAME=demo
SIEBEL_PASSWORD=demo
SIEBEL_TIMEOUT_MS=8000
```

No vendor URL, no vendor credential, no proprietary endpoint is hardcoded
in any package.

---

## 5. Three operating postures

LegacyOps can be deployed in three postures relative to a Siebel-like
environment:

1. **Standalone CRM** — no legacy connection. LegacyOps is the only CRM.
2. **Legacy Overlay** — LegacyOps presents legacy data through a modern
   UI; writes can be read-only, workflow-wrapped or controlled
   write-back.
3. **Progressive Migration** — modules are migrated one at a time using
   the migration engine, with source-of-truth registry, dry-runs,
   reconciliation and rollback.

These postures correspond to the seven integration modes documented in
`docs/INTEGRATION_MODES.md`.

---

## 6. What we do NOT do

- ❌ Copy Siebel schemas or repository files.
- ❌ Reproduce Oracle-copyrighted sample code.
- ❌ Hardcode vendor endpoints in packages.
- ❌ Depend on Siebel Open UI at runtime.
- ❌ Claim production-readiness for the scaffold (see
  `docs/ENTERPRISE_READINESS_GAP.md`).
- ❌ Store real customer data in the synthetic phase.

---

## 7. What we DO

- ✅ Ship a Siebel-like bridge contract with conceptual DTOs.
- ✅ Implement a Fake Siebel Lab that reproduces realistic integration
  behaviour (latency, session expiry, permission errors, conflicts).
- ✅ Provide an anti-corruption layer that maps DTOs to the LegacyOps
  domain without leaking Siebel concepts.
- ✅ Provide a migration engine with dry-run, conflict detection,
  reconciliation and rollback.
- ✅ Provide legacy observability separated from operational CRM metrics.
- ✅ Provide a pilot playbook and ROI metrics template.
- ✅ Document honestly what is and is not production-ready.

---

## 8. Reference

- `packages/siebel-bridge/` — bridge contract, Fake Siebel Lab, mapping
  helpers.
- `docs/ANTI_CORRUPTION_LAYER.md` — translation strategy.
- `docs/SIEBEL_OBJECT_MAPPING.md` — conceptual object mapping.
- `docs/SIEBEL_OPENUI_RESEARCH.md` — Open UI as optional future surface.
- `docs/SIEBEL_OBSERVABILITY_STRATEGY.md` — observability for legacy.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/PUBLIC_SIEBEL_RESEARCH_NOTES.md` — public ecosystem audit.

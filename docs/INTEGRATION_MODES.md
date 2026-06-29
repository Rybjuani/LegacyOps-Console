# Integration Modes

> LegacyOps Console can run in seven integration modes. Each mode is a
> different posture relative to the legacy system. The mode is selected
> per module (not per deployment) through the source-of-truth registry.

---

## 1. The seven modes

| # | Mode | Source of truth | Writes | Risk | Use case |
|---|------|-----------------|--------|------|----------|
| 1 | Standalone CRM | LegacyOps | LegacyOps only | None | Greenfield deployment |
| 2 | Synthetic mode | Fake Siebel Lab | Fake Siebel Lab | None | Demos, training, integration tests |
| 3 | Read-only legacy overlay | Legacy system | Legacy system (manual) | Low | First pilot stage |
| 4 | Workflow wrapper | Legacy system | Legacy system (manual), LegacyOps guides | Low-Medium | Second pilot stage |
| 5 | Controlled write-back | Legacy system (primary), LegacyOps (secondary) | LegacyOps writes back through bridge | Medium | Third pilot stage |
| 6 | Hybrid source-of-truth | Per-field: LegacyOps or legacy | Per-field | Medium-High | Fourth pilot stage |
| 7 | Progressive replacement | LegacyOps (per module) | LegacyOps (per module) | High | Fifth pilot stage |

---

## 2. Mode 1 — Standalone CRM

LegacyOps is the only system. No legacy connection. All data is created
and owned by LegacyOps.

**Configuration:**

```text
LEGACYOPS_MODE=standalone
```

**When to use:**

- Greenfield deployments.
- Demos that do not need legacy integration.
- New business units that do not inherit legacy data.

---

## 3. Mode 2 — Synthetic mode

LegacyOps runs against the in-memory Fake Siebel Lab. No real legacy
connection. The bridge talks to a `FakeSiebelAdapter` that simulates
latency, session expiry, permission errors and conflicts.

**Configuration:**

```text
LEGACYOPS_MODE=synthetic
```

**When to use:**

- Demos.
- Training.
- Integration tests.
- Pilot preparation (stage 1).

---

## 4. Mode 3 — Read-only legacy overlay

LegacyOps presents legacy data through a modern UI. Operators see a
modern Customer 360, but writes still go to the legacy system manually
(or not at all).

**Configuration:**

```text
LEGACYOPS_MODE=legacy_overlay
SIEBEL_BASE_URL=https://legacy.example.com/siebel
SIEBEL_USERNAME=readonly_user
SIEBEL_PASSWORD=...
```

**When to use:**

- Pilot stage 2.
- Risk-averse customers who want to validate the UX before any
  write-back.

**ACL behaviour:** forward mapping only (legacy → LegacyOps). No reverse
mapping is invoked.

---

## 5. Mode 4 — Workflow wrapper

LegacyOps guides the operator through a workflow. The legacy system
remains the source of truth, but LegacyOps owns the audit trail and SLA
for the workflow.

**Configuration:**

```text
LEGACYOPS_MODE=workflow_wrapper
```

**When to use:**

- Pilot stage 3.
- When a workflow needs modern guidance but data ownership cannot move
  yet.

**ACL behaviour:** forward mapping; workflow state is owned by LegacyOps;
business data still owned by legacy.

---

## 6. Mode 5 — Controlled write-back

LegacyOps writes back to the legacy system through the bridge. Every
write goes through conflict detection. The legacy system remains the
primary source of truth.

**Configuration:**

```text
LEGACYOPS_MODE=controlled_write_back
```

**When to use:**

- Pilot stage 4.
- For low-risk modules where write-back is safe.

**ACL behaviour:** forward + reverse mapping; conflicts are surfaced
before write; every write produces an audit event and a legacy-side
trace.

---

## 7. Mode 6 — Hybrid source-of-truth

Some fields are owned by LegacyOps, others by legacy. The
source-of-truth registry decides per module and per field.

**Configuration:**

```text
LEGACYOPS_MODE=hybrid
```

**When to use:**

- Pilot stage 5.
- When a module has been partially migrated (e.g. case subject owned by
  LegacyOps, case billing fields still owned by legacy).

**ACL behaviour:** per-field mapping direction. Conflicts are detected by
the migration engine.

---

## 8. Mode 7 — Progressive replacement

Module by module, LegacyOps becomes the primary system. The legacy
system is retired per module after reconciliation.

**Configuration:**

```text
LEGACYOPS_MODE=progressive
```

**When to use:**

- Pilot stage 6+.
- After a successful cut-over for one or more modules.

**ACL behaviour:** reverse mapping (LegacyOps → legacy) is kept only for
historical read access during the legacy system's wind-down.

---

## 9. Mode selection is per module

A single deployment can run different modules in different modes. The
source-of-truth registry (`packages/migration/SourceOfTruthRegistry`)
records the current rule for each module/field, and the ACL respects it.

Example:

- `customer.identity` → primary: `siebel_like` (legacy still owns
  identity).
- `case.billing_claim` → fallback: primary `legacyops`, secondary
  `siebel_like`.
- `billing.invoice` → primary: `billing_provider` (external billing).
- `interaction.history` → merge: both systems, merge by `occurredAt`.

---

## 10. Mode migration path

A module typically moves through:

```
read_only_overlay → workflow_wrapper → controlled_write_back
                → hybrid → progressive_replacement → (legacy retired)
```

Each transition is gated by:

- a successful dry-run,
- a reconciliation report,
- a rollback plan,
- a sign-off in the pilot playbook.

---

## 11. Reference

- `packages/migration/` — source-of-truth registry, migration engine.
- `packages/siebel-bridge/` — bridge contract and Fake Siebel Lab.
- `docs/PILOT_PLAYBOOK_SIEBEL.md` — pilot path.
- `docs/ANTI_CORRUPTION_LAYER.md` — ACL behaviour.

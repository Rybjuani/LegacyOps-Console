# Anti-Corruption Layer

> How LegacyOps translates legacy/Siebel-like concepts into its own domain
> without contaminating the core. This is the architectural seam that
> makes progressive migration possible.

---

## 1. Why an ACL?

Without an anti-corruption layer (ACL), a CRM that integrates with a
legacy system tends to **absorb** the legacy system's vocabulary: the
domain starts talking about “Business Components”, “Integration Objects”,
“SR numbers”, and before long the core is coupled to one vendor.

An ACL forces every legacy concept to be **translated** at the boundary.
The core domain never sees legacy types. The legacy system can be
replaced, swapped, or retired without touching the core.

---

## 2. Where the ACL lives in LegacyOps

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   LegacyOps core domain (packages/domain)                      │
│   - Customer, Account, Case, Workflow, Audit, RBAC             │
│                                                                │
└──────────────────────────────┬─────────────────────────────────┘
                               │  pure domain types
                               │
┌──────────────────────────────┴─────────────────────────────────┐
│   Adapter contracts (packages/adapters)                        │
│   - CRMAdapter, BillingAdapter, TicketingAdapter, ...          │
│   - vendor-neutral                                             │
└──────────────────────────────┬─────────────────────────────────┘
                               │  vendor-neutral contracts
                               │
┌──────────────────────────────┴─────────────────────────────────┐
│   Siebel-like bridge (packages/siebel-bridge)                  │
│   - Siebel-like DTOs (Account, Contact, SR, Asset, ...)        │
│   - Mapping helpers (siebelToLegacyOps / legacyOpsToSiebel)    │
│   - Fake Siebel Lab                                            │
└────────────────────────────────────────────────────────────────┘
```

The mapping helpers in `packages/siebel-bridge/src/mapping/` are the
**ACL translators**. They are pure functions, easily testable, with no
side effects.

---

## 3. Translation rules

1. **No Siebel type leaks into the domain.** The domain package does not
   import from `siebel-bridge`.
2. **External IDs are preserved.** Each domain entity has an optional
   `externalId` so traceability is never lost.
3. **Mapping is explicit.** Each field mapping is a function call, not a
   convention. The mapping table is documented in
   `docs/SIEBEL_OBJECT_MAPPING.md`.
4. **Conflicts are surfaced.** When the same field is owned by two
   systems, the ACL flags it. The migration engine's conflict detector
   is the escalation path.
5. **Reverse mapping exists.** For controlled write-back, the same
   helpers translate LegacyOps entities back to Siebel-like DTOs.
6. **Coexistence is supported.** The source-of-truth registry
   (`packages/migration/`) decides per module and per field who owns the
   truth. The ACL respects that decision.

---

## 4. Example: a Service Request becomes a Case

```ts
// legacy side
const siebelSR: SiebelServiceRequest = {
  id: 'ext_sr_1',
  accountId: 'ext_acc_1',
  contactId: 'ext_cust_1',
  status: 'Open',
  priority: '1-High',
  category: 'Billing Dispute',
  subject: 'Bad invoice',
  description: 'desc',
  // ...
};

// ACL translation
const caseData = mapSiebelSRToCase(siebelSR, 'cust_1');
// → { id: 'case_ext_sr_1', customerId: 'cust_1', externalId: 'ext_sr_1',
//     status: 'open', priority: 'urgent', category: 'billing_claim',
//     subject: 'Bad invoice', description: 'desc', ... }
```

The domain sees a `Case`. The legacy system sees a `ServiceRequest`. The
ACL keeps them aligned.

---

## 5. Example: reverse mapping for write-back

```ts
const legacyopsCase: Case = {
  id: 'case_1',
  customerId: 'cust_1',
  status: 'in_progress',
  priority: 'urgent',
  // ...
};

const siebelSR = mapLegacyOpsCaseToSiebelServiceRequest(legacyopsCase);
// → { accountId: '...', status: 'In Progress', priority: '1-High', ... }
```

The bridge then writes the DTO back through `SiebelCaseAdapter`.

---

## 6. What the ACL prevents

- ❌ A `Case` field called `srNumber` — that would leak Siebel
  vocabulary into the domain.
- ❌ A `Customer` field called `bu` (Business Unit) — same.
- ❌ Direct imports of `SiebelServiceRequest` from the domain package.
- ❌ Hardcoded Siebel status strings in the domain.
- ❌ A single “integration object” type that bundles unrelated fields.

---

## 7. What the ACL enables

- ✅ The legacy system can be replaced without touching the domain.
- ✅ A second legacy system (e.g. a different CRM) can be added by
  writing a new adapter and mapping helpers.
- ✅ The migration engine can compare source and target records field
  by field.
- ✅ Audit can trace any internal record back to its external origin.
- ✅ Operators work in a single, coherent vocabulary regardless of how
  many legacy systems feed LegacyOps.

---

## 8. Testing the ACL

The ACL is covered by tests in
`packages/siebel-bridge/src/mapping.test.ts`. Every mapping helper has at
least one positive test and one edge case. When new fields are added,
new tests are added.

---

## 9. Reference

- `packages/domain/` — pure domain.
- `packages/adapters/` — vendor-neutral contracts.
- `packages/siebel-bridge/src/contracts/` — Siebel-like DTOs.
- `packages/siebel-bridge/src/mapping/siebelToLegacyOps.ts` — forward
  mapping.
- `packages/siebel-bridge/src/mapping/legacyOpsToSiebel.ts` — reverse
  mapping.
- `packages/migration/` — source-of-truth registry and migration engine.

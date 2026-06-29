# Siebel-like Object Mapping

> Conceptual mapping between Siebel-like concepts and the LegacyOps domain.
> These are **conceptual** mappings, not proprietary schemas. They are
> implemented in `packages/siebel-bridge/src/mapping/` as pure functions.

---

## 1. Top-level mapping table

| Siebel-like concept | LegacyOps concept | Notes |
|---|---|---|
| Account | Account / Customer | Account is the billing container; Customer is the human/legal entity. |
| Contact | Customer / ContactMethod | A Contact maps to a Customer plus its ContactMethods. |
| Service Request | Case | The legacy SR number is preserved as `externalId`. |
| Asset / Product | Service / Product | Asset tracks the customer's instance of a Product. |
| Activity | Interaction / Task | Activities become Interactions or workflow tasks. |
| Order | ServiceOrder | New/Change/Disconnect/Suspend → install/change/terminate/suspend. |
| Business Service | Adapter Operation | Each Business Service method is exposed as an adapter operation. |
| Integration Object | Integration DTO | Integration Objects are mapped to typed DTOs at the bridge boundary. |
| Business Object | (aggregate) | Used for metadata only. |
| Business Component | (typed view) | Used for metadata only. |

---

## 2. Status mapping

| Siebel-like status | LegacyOps status |
|---|---|
| Active (Account) | active |
| Suspended (Account) | suspended |
| Inactive (Account) | closed |
| Open (Service Request) | open |
| In Progress (Service Request) | in_progress |
| Pending Customer (Service Request) | waiting_customer |
| Closed (Service Request) | closed |
| Cancelled (Service Request) | cancelled |
| Paid (Invoice) | paid |
| Partial (Invoice) | partial |
| Overdue (Invoice) | overdue |
| Disputed (Invoice) | disputed |
| Issued (Invoice) | issued |

---

## 3. Priority mapping

| Siebel-like priority | LegacyOps priority |
|---|---|
| 1-High | urgent |
| 2-Medium | normal |
| 3-Low | low |

---

## 4. Category mapping

LegacyOps maps a free-text Siebel-like category to one of its own
categories using keyword detection:

| Keyword in legacy category | LegacyOps category |
|---|---|
| `billing`, `invoice` | billing_claim |
| `cancel` | cancellation_retention |
| `technical`, `outage` | technical_complaint |
| `promise`, `payment` | payment_promise |
| `service` | service_request |
| `complaint` | complaint |
| (anything else) | general_inquiry |

The mapping helper is `mapSiebelCategoryToLegacyOps`.

---

## 5. Field mapping (Service Request → Case)

| Siebel-like field | LegacyOps Case field | Transform |
|---|---|---|
| Id | externalId | identity |
| AccountId | accountId | identity |
| ContactId | customerId | identity (then resolved through ID mapping store) |
| Subject | subject | identity |
| Description | description | identity |
| Status | status | enum map |
| Priority | priority | enum map |
| Category | category | keyword map |
| Owner | assigneeId | identity |
| Created | createdAt | date_iso |
| Updated | updatedAt | date_iso |

---

## 6. Field mapping (Contact → Customer)

| Siebel-like field | LegacyOps Customer field | Transform |
|---|---|---|
| Id | externalId | identity |
| FirstName + LastName | displayName | concat |
| Email | email | identity |
| Phone | phone | identity |
| DocumentNumber | documentNumber | identity |
| AccountId | accountId | identity (resolved through ID mapping store) |

---

## 7. Field mapping (Invoice Interface → Invoice)

| Siebel-like field | LegacyOps Invoice field | Transform |
|---|---|---|
| Id | externalId | identity |
| AccountId | accountId | identity |
| Period | period | identity |
| TotalAmount | totalAmount | currency_cents (optional) |
| PaidAmount | paidAmount | currency_cents (optional) |
| Status | status | enum map |
| IssuedAt | issuedAt | date_iso |
| DueAt | dueAt | date_iso |

---

## 8. Reverse mapping (LegacyOps → Siebel-like)

For controlled write-back, the same helpers exist in reverse:

- `mapLegacyOpsCustomerToSiebelContact`
- `mapLegacyOpsAccountToSiebelAccount`
- `mapLegacyOpsCaseToSiebelServiceRequest`

These are used by the bridge when the operator updates a record inside
LegacyOps and the change must be propagated back to the legacy system.

---

## 9. Important caveats

- These mappings are **conceptual**. They are not a copy of any vendor
  schema.
- The LegacyOps domain **never** imports Siebel-like types. The mapping
  happens exclusively inside `packages/siebel-bridge/`.
- A real deployment would configure additional field mappings through the
  migration engine (`packages/migration/`), not by editing the core
  domain.
- The ID mapping store (`IdMappingStore`) preserves the link between
  external and internal IDs so auditability is never lost.

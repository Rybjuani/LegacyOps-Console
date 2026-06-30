# Siebel Bridge Contracts

> Conceptual contracts exposed by `packages/siebel-bridge/src/contracts/`.
> These contracts are vendor-neutral: they describe what a real adapter
> must implement, without reproducing any proprietary Siebel schema.

---

## 1. Layered contracts

The bridge is organised in three layers:

1. **DTOs** (`contracts/types.ts`) — conceptual Siebel-like object types.
2. **Bridge** (`contracts/siebel.ts`) — the aggregate adapter contract the LegacyOps domain talks to.
3. **Transports** (`contracts/transports.ts`) — low-level transport contracts (REST, SOAP, EAI) that a real adapter implementation would satisfy.

The LegacyOps domain NEVER imports from `contracts/`. It talks to the
bridge through the `CRMAdapter` / `BillingAdapter` / etc. contracts in
`packages/adapters/`. The anti-corruption layer (mapping helpers) is the
only place that touches both worlds.

---

## 2. DTOs (conceptual Siebel-like types)

| DTO | Maps to (LegacyOps) |
|---|---|
| `SiebelAccount` | `Account` |
| `SiebelContact` | `Customer` + `ContactMethod[]` |
| `SiebelServiceRequest` | `Case` |
| `SiebelAsset` | `Service` / `ServiceOrder` |
| `SiebelActivity` | `Interaction` |
| `SiebelOrder` | `ServiceOrder` |
| `SiebelBusinessObject` | (metadata only) |
| `SiebelIntegrationObject` | (metadata only) |
| `SiebelBusinessService` | (invokable operation) |

These types live in `packages/siebel-bridge/src/contracts/types.ts`.
They are intentionally generic — no field names are copied from any
vendor schema.

---

## 3. Bridge contract

The `SiebelBridge` interface in `contracts/siebel.ts` aggregates:

- `SiebelCustomerAdapter` — search/read contacts, accounts, assets, orders, activities.
- `SiebelAccountAdapter` — list/get accounts.
- `SiebelCaseAdapter` — list/get/create service requests.
- `SiebelBillingAdapter` — billing summary, invoices.
- `SiebelBusinessServiceInvoker` — invoke a business service method.
- `SiebelMetadataAdapter` — list business objects, integration objects, business services.
- `SiebelAuthProvider` — login, verify, logout.
- `SiebelHealthProbe` — health check.

The `FakeSiebelAdapter` in `mock/FakeSiebelAdapter.ts` implements this
contract against in-memory data. A real adapter (`RealSiebelAdapter`,
issue #4) would implement the same contract against a Siebel REST
endpoint.

---

## 4. Transport contracts

The transport layer in `contracts/transports.ts` defines:

| Contract | Purpose |
|---|---|
| `SiebelRestClient` | GET/POST/PUT/DELETE against a Siebel REST resource. |
| `SiebelSoapClient` | SOAP requests against a Siebel EAI endpoint. |
| `SiebelEaiClient` | Asynchronous EAI integration object requests. |
| `SiebelBusinessObjectRepository` | List/describe business objects and components. |
| `SiebelBusinessComponentQuery` | Typed query against a business component. |
| `SiebelSessionManager` | Login, verify, logout, refresh. |
| `SiebelIntegrationObjectMapper` | Serialize/deserialize integration objects. |
| `SiebelErrorMapper` | Map raw backend errors to `SiebelErrorShape`. |

A real adapter implementation satisfies `SiebelTransport` (the aggregate
of all transport contracts). The `FakeSiebelAdapter` does NOT implement
the transport contracts directly — it implements the higher-level
`SiebelBridge` against in-memory data. A future `RealSiebelAdapter`
would compose a `SiebelRestClient` + `SiebelSessionManager` + etc. to
satisfy the same `SiebelBridge` contract.

---

## 5. Mapping helpers (anti-corruption layer)

The mapping helpers in `mapping/siebelToLegacyOps.ts` and
`mapping/legacyOpsToSiebel.ts` are pure functions. They translate DTOs
in both directions without side effects.

Forward (legacy → LegacyOps):
- `mapSiebelAccountToLegacyOps`
- `mapSiebelContactToCustomer`
- `mapSiebelContactToContactMethods`
- `mapSiebelSRToCase`
- `mapSiebelCategoryToLegacyOps`
- `mapSiebelActivityToInteraction`
- `mapSiebelAssetToServiceOrder`
- `mapSiebelOrderToServiceOrder`
- `mapSiebelInvoiceToLegacyOps`

Reverse (LegacyOps → legacy, for controlled write-back):
- `mapLegacyOpsCustomerToSiebelContact`
- `mapLegacyOpsAccountToSiebelAccount`
- `mapLegacyOpsCaseToSiebelServiceRequest`

See `docs/SIEBEL_OBJECT_MAPPING.md` for the conceptual mapping table.

---

## 6. Fake Siebel Lab

The Fake Siebel Lab in `mock/` provides:

- `FakeSiebelAdapter` — full `SiebelBridge` implementation against in-memory data.
- `FakeSiebelSessionStore` — 30-minute TTL sessions, force-expire for tests.
- `FakeSiebelErrorSimulator` — deterministic (`setNextError`) + stochastic (configurable rates) error injection.
- `FakeSiebelMetadataProvider` — synthetic business objects, integration objects, business services.

See `docs/FAKE_SIEBEL_LAB.md` for the full specification.

---

## 7. Real Siebel Adapter (foundation)

The `real/` directory contains a production-shaped REST adapter that
implements the full `SiebelBridge` contract:

- `RealSiebelConfig` — typed config + env loader + `redactConfig()`.
- `RealSiebelEndpointMap` — configurable REST paths with `{id}` placeholders.
- `SiebelRestHttpClient` — HTTP client with timeout, retry, circuit breaker.
- `SiebelRestErrorMapper` — maps HTTP errors + SBL-* codes to structured errors.
- `RetryPolicy` — pure retry helper with deterministic backoff.
- `CircuitBreaker` — closed/open/half_open state machine.
- `SiebelRestSessionManager` — session lifecycle for `authMode=session`.
- `RealSiebelPayloadMapper` — defensive raw-payload → DTO mapping.
- `RealSiebelAdapter` — aggregates all of the above into `SiebelBridge`.

**Status:** foundation implemented and tested against mocked REST behaviour.
Validation against a real Siebel sandbox is still pending — see issue #4
and `docs/REAL_SIEBEL_ADAPTER.md`.

The adapter does NOT replace the Fake Siebel Lab. Both coexist; the API
selects which one to use via `LEGACYOPS_SIEBEL_ADAPTER` env var (default:
`fake`).

---

## 8. Implementation status

| Contract | Status |
|---|---|
| DTOs | ✅ Shipped |
| `SiebelBridge` aggregate | ✅ Shipped |
| Transport contracts | ✅ Defined (interfaces only) |
| `FakeSiebelAdapter` | ✅ Shipped |
| `RealSiebelAdapter` foundation | ✅ Shipped (mock-tested) |
| `RealSiebelAdapter` sandbox validation | ❌ Pending (issue #4) |
| Mapping helpers | ✅ Shipped |
| Real payload mapper (defensive) | ✅ Shipped |
| Deterministic error simulation | ✅ Shipped |
| Stochastic error simulation | ✅ Shipped |

---

## 9. Reference

- `packages/siebel-bridge/src/contracts/`
- `packages/siebel-bridge/src/mapping/`
- `packages/siebel-bridge/src/mock/`
- `packages/siebel-bridge/src/real/`
- `docs/SIEBEL_OBJECT_MAPPING.md`
- `docs/FAKE_SIEBEL_LAB.md`
- `docs/FAKE_SIEBEL_ERROR_MODEL.md`
- `docs/REAL_SIEBEL_ADAPTER.md`
- `docs/SIEBEL_REST_ADAPTER_TESTING.md`
- `docs/SIEBEL_SANDBOX_ONBOARDING.md`
- `docs/ANTI_CORRUPTION_LAYER.md`

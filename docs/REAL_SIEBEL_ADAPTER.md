# Real Siebel Adapter

> Foundation for a real REST adapter behind the `SiebelBridge` contract.
> Coexists with the Fake Siebel Lab. Validation against a real Siebel
> sandbox is still pending — see issue #4.

---

## 1. What this implements

The `packages/siebel-bridge/src/real/` directory contains a production-
shaped REST adapter that implements the full `SiebelBridge` contract:

| Component | File | Role |
|---|---|---|
| `RealSiebelConfig` | `RealSiebelConfig.ts` | Typed config + env loader + `redactConfig()` |
| `RealSiebelEndpointMap` | `RealSiebelEndpointMap.ts` | Configurable REST paths with `{id}` placeholders |
| `SiebelRestHttpClient` | `SiebelRestHttpClient.ts` | HTTP client with timeout, retry, circuit breaker, auth headers |
| `SiebelRestErrorMapper` | `SiebelRestErrorMapper.ts` | Maps HTTP errors + Siebel-like `SBL-*` codes to structured errors |
| `RetryPolicy` | `RetryPolicy.ts` | Pure retry helper with deterministic backoff + injectable sleep |
| `CircuitBreaker` | `CircuitBreaker.ts` | closed/open/half_open state machine with injectable clock |
| `SiebelRestSessionManager` | `SiebelRestSessionManager.ts` | Session lifecycle for `authMode=session` |
| `RealSiebelPayloadMapper` | `RealSiebelPayloadMapper.ts` | Defensive raw-payload → DTO mapping |
| `RealSiebelAdapter` | `RealSiebelAdapter.ts` | Aggregates all of the above into the `SiebelBridge` contract |

Every component is unit-tested with mock `fetch` — no real Siebel
endpoint is required.

---

## 2. What this does NOT implement (yet)

- **Validation against a real Siebel sandbox.** The default endpoint map
  (`DEFAULT_ENDPOINT_MAP`) is CONCEPTUAL. Real Siebel REST URL shapes vary
  across versions and customer configurations. Each pilot MUST review and
  override the paths based on the customer's actual Siebel REST setup.
- **A confirmed authentication scheme.** The adapter supports `basic`,
  `session` and `oauth` modes, but which one a real customer uses depends
  on their Siebel configuration.
- **Performance baseline.** No load testing has been done against a real
  endpoint.
- **Legal/security review.** The conceptual DTOs are original, but a
  customer's legal team must confirm no proprietary schema is reproduced.

---

## 3. Relationship with `SiebelBridge`

The `SiebelBridge` interface in
`packages/siebel-bridge/src/contracts/siebel.ts` is the aggregate contract
the LegacyOps domain talks to. Both `FakeSiebelAdapter` and
`RealSiebelAdapter` implement it. The API selects which one to use at
startup via `apps/api/src/siebelAdapterFactory.ts`.

```
                 SiebelBridge (contract)
                        |
           +------------+------------+
           |                         |
   FakeSiebelAdapter          RealSiebelAdapter
   (in-memory demo)           (REST, needs real endpoint)
```

The LegacyOps domain NEVER imports from `packages/siebel-bridge/src/real/`
directly — it always goes through the `SiebelBridge` contract. This is the
anti-corruption layer.

---

## 4. Relationship with the Fake Siebel Lab

The Fake Siebel Lab (`packages/siebel-bridge/src/mock/`) is NOT replaced.
It remains the default adapter for:

- demos
- training
- smoke tests
- integration tests
- any environment without a real Siebel endpoint

The `LEGACYOPS_SIEBEL_ADAPTER` env var selects the mode:

| Value | Behaviour |
|---|---|
| `fake` (default) | Use `FakeSiebelAdapter` against in-memory data. |
| `real` | Try to load `RealSiebelConfig` from env. If valid, use `RealSiebelAdapter`. If invalid, fall back to `fake` and record the error. |

The fallback is intentional: a misconfigured real adapter never crashes
the API.

---

## 5. Relationship with the Anti-Corruption Layer

The `RealSiebelPayloadMapper` is the defensive boundary that converts raw
REST JSON payloads into conceptual Siebel-like DTOs (`SiebelAccount`,
`SiebelContact`, `SiebelServiceRequest`, etc.). Raw Siebel fields NEVER
escape to the LegacyOps domain.

The mappers try common field names (direct + aliases) and fall back to
safe defaults when a field is missing. They throw `PayloadMappingError`
only when a REQUIRED field (typically `Id`) is absent.

The existing mapping helpers in
`packages/siebel-bridge/src/mapping/siebelToLegacyOps.ts` continue to
translate conceptual DTOs into the LegacyOps domain. The ACL is therefore
two layers:

```
raw Siebel REST JSON
      ↓  RealSiebelPayloadMapper  (defensive, field aliases)
conceptual Siebel-like DTOs
      ↓  siebelToLegacyOps.ts     (existing ACL)
LegacyOps domain entities
```

---

## 6. Configuring endpoint maps

The `RealSiebelEndpointMap` interface lists every REST path the adapter
uses. Defaults are in `DEFAULT_ENDPOINT_MAP`. A pilot can override any
path by passing a `Partial<RealSiebelEndpointMap>` to the adapter
constructor:

```ts
const adapter = new RealSiebelAdapter({
  config,
  fetchImpl: fetch,
  endpointMap: {
    contactsSearch: '/custom/contacts',
    accountById: '/custom/accounts/{id}'
  }
});
```

The `{id}`, `{accountId}`, `{businessService}` and `{method}` placeholders
are substituted by the `fillPath()` helper.

**The default paths are CONCEPTUAL.** They follow a plausible
`/siebel/v1.0/data/{BO}/{BC}` and `/siebel/v1.0/service/{bs}/{method}`
shape, but no claim is made that they work against any specific Siebel
version. Each customer pilot MUST confirm the actual paths.

---

## 7. Why the default paths are conceptual

Siebel REST URL shapes vary across:

- Siebel versions (16.x, 17.x, 18.x, 19.x, 20.x, 21.x, 22.x, 23.x, 24.x, 25.x, 26.x)
- customer customisations (new business objects, renamed components)
- deployment topology (gateway vs app server)
- authentication scheme (basic, session, OAuth, SAML)

Hardcoding a single "universal" path would be misleading. The defaults
exist so the adapter is runnable out of the box against a mock, but every
pilot must review and override them.

---

## 8. How raw Siebel responses are kept out of the domain

Three layers of defence:

1. **`RealSiebelPayloadMapper`** extracts only the conceptual fields. Any
   unknown field in the raw payload is dropped.
2. **TypeScript types** — the DTOs (`SiebelAccount`, etc.) only declare
   conceptual fields. Even if a raw field slipped through, the type
   system would not let the domain read it.
3. **Tests** — `RealSiebelAdapter.test.ts` has a dedicated test
   (`does not leak raw payload into the returned DTO`) that injects raw
   fields and asserts they do not appear in the mapped output.

---

## 9. Audit and observability hooks

The `RealSiebelAdapter` accepts optional hooks:

```ts
new RealSiebelAdapter({
  config,
  fetchImpl: fetch,
  hooks: {
    onCall: (event: AdapterCallEvent) => {
      // event: { method, path, durationMs, status, httpStatus, errorCode, retriable, attempts }
    },
    nowFn: () => Date.now(),
    sleepFn: (ms) => new Promise((r) => setTimeout(r, ms)),
    randomFn: () => Math.random()
  }
});
```

- `onCall` fires for every HTTP call (success, error, or blocked by
  circuit breaker). Use it to feed the audit log and the legacy
  observability metrics.
- `nowFn`, `sleepFn`, `randomFn` are injectable so tests are fully
  deterministic (no real time, no real randomness).

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Default paths do not match the customer's Siebel. | Each pilot overrides the endpoint map. Documented in `docs/SIEBEL_SANDBOX_ONBOARDING.md`. |
| Authentication scheme mismatch. | Adapter supports basic/session/oauth. The pilot confirms which one before enabling real mode. |
| Rate limiting by the legacy system. | Circuit breaker + retry policy with backoff. Tunable via env. |
| Raw Siebel schema drift. | Defensive mappers with field aliases. Tests cover alias and missing-field cases. |
| Credential leakage. | `redactConfig()` exposes only `has*` booleans. Diagnostic endpoints never return credentials. CI runs `secret-scan-lite`. |
| Real adapter crashes the API. | Factory falls back to fake on config error. The API stays up. |

---

## 11. Reference

- `packages/siebel-bridge/src/real/`
- `apps/api/src/siebelAdapterFactory.ts`
- `apps/api/src/state.ts`
- `docs/SIEBEL_BRIDGE_CONTRACTS.md`
- `docs/SIEBEL_REST_ADAPTER_TESTING.md`
- `docs/SIEBEL_SANDBOX_ONBOARDING.md`
- `docs/FAKE_SIEBEL_ERROR_MODEL.md`
- `docs/ANTI_CORRUPTION_LAYER.md`
- Issue #4 on GitHub

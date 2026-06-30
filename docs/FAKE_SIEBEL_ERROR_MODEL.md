# Fake Siebel Error Model

> How the Fake Siebel Lab simulates integration failures. Two modes are
> supported: **deterministic** (for tests) and **stochastic** (for demos).

---

## 1. Error codes

The simulator models eight Siebel-like error codes. These are conceptual
and do NOT reproduce any vendor's actual error catalog.

| Code | Meaning | HTTP status | Retriable |
|---|---|---|---|
| `SBL-DBC-001` | Siebel-like database error | 500 | true |
| `SBL-AUTH-001` | Session expired | 401 | false |
| `SBL-AUTH-002` | Permission denied | 403 | false |
| `SBL-BCS-001` | Business component not found | 404 | false |
| `SBL-BSR-001` | Business service not found | 404 | false |
| `SBL-EAI-001` | Integration layer timeout | 504 | true |
| `SBL-DAT-001` | Data conflict | 409 | false |
| `SBL-GEN-001` | Generic Siebel-like error | 500 | true |

Each error code maps to a `SiebelErrorShape`:

```ts
interface SiebelErrorShape {
  code: SiebelErrorCode;
  message: string;
  httpStatus: number;
  retriable: boolean;
}
```

---

## 2. Deterministic mode

Tests use deterministic mode to avoid flakiness from `Math.random()`.

```ts
const sim = new FakeSiebelErrorSimulator();
sim.setNextError('timeout');
expect(() => sim.maybeThrow()).toThrow(); // throws SBL-EAI-001
expect(() => sim.maybeThrow()).not.toThrow(); // forced error consumed
```

Supported deterministic errors:

| `setNextError(...)` | Throws |
|---|---|
| `'timeout'` | `SBL-EAI-001` |
| `'auth_expired'` | `SBL-AUTH-001` |
| `'permission_denied'` | `SBL-AUTH-002` |
| `'conflict'` | `SBL-DAT-001` |
| `'partial_data'` | `SBL-DAT-001` (also flags `isPartialData`) |
| `'generic'` | `SBL-GEN-001` |
| `null` | clears the forced error |

The same pattern applies to partial data:

```ts
sim.setNextPartialData(true);
expect(sim.isPartialData()).toBe(true); // forced
expect(sim.isPartialData()).toBe(false); // falls back to stochastic rate
```

---

## 3. Stochastic mode

Demos use stochastic mode to make the Fake Siebel Lab feel realistic.

```ts
const sim = new FakeSiebelErrorSimulator({
  timeoutRate: 0.03,         // 3% of calls time out
  authFailureRate: 0.0,      // 0% auth failures
  permissionDeniedRate: 0.02, // 2% permission denied
  conflictRate: 0.01,        // 1% conflicts
  partialDataRate: 0.05,     // 5% partial data
  fixedLatencyMs: 120,
  jitterMs: 80
});
```

Defaults are defined in `DEFAULT_ERROR_CONFIG`. The API's `AppState`
overrides these to 0 so smoke tests and demos are reproducible.

---

## 4. Latency

The simulator adds latency to every adapter call:

```ts
latency() = fixedLatencyMs + Math.floor(Math.random() * jitterMs)
```

In deterministic tests, set `fixedLatencyMs: 0, jitterMs: 0` to avoid
unnecessary delays.

---

## 5. How the adapter uses the simulator

`FakeSiebelAdapter.simulate(ctx)` is called at the start of every
adapter method:

```ts
private async simulate(ctx?: AdapterCallContext): Promise<void> {
  await new Promise((r) => setTimeout(r, this.errors.latency()));
  this.errors.maybeThrow(ctx);
}
```

This means every adapter call:
1. Waits for the configured latency.
2. Maybe throws a forced (deterministic) error.
3. Maybe throws a stochastic error based on the configured rates.

---

## 6. Tests

Deterministic error coverage lives in:

- `packages/siebel-bridge/src/mock/FakeSiebelErrorSimulator.test.ts` (13 tests)
- `packages/siebel-bridge/src/mock/FakeSiebelAdapter.errors.test.ts` (11 tests)

Both files disable stochastic rates in their `beforeEach` and use
`setNextError` / `setNextPartialData` to force specific failures. The
tests are fully deterministic and never flake.

---

## 7. Mapping to HTTP responses

When the API catches an `AdapterError`, it maps it to an HTTP response:

| Adapter error code | HTTP status |
|---|---|
| `auth` | 401 |
| `permission` | 403 |
| `not_found` | 404 |
| `conflict` | 409 |
| `timeout` | 504 |
| `unavailable` | 503 |
| `unknown` | 502 |

The `SiebelErrorShape` carries its own `httpStatus` field, but the API
route layer uses the `AdapterError` status instead — the two are kept
in sync.

---

## 8. Reference

- `packages/siebel-bridge/src/mock/FakeSiebelErrorSimulator.ts`
- `packages/siebel-bridge/src/mock/FakeSiebelAdapter.ts`
- `packages/siebel-bridge/src/contracts/types.ts` (SiebelErrorShape, SiebelErrorCode)
- `docs/FAKE_SIEBEL_LAB.md`
- `docs/SIEBEL_BRIDGE_CONTRACTS.md`

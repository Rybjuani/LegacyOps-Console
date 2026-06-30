# Real Siebel REST Adapter — Testing

> How the `RealSiebelAdapter` is tested today, and how to test it against
> a real Siebel sandbox when one becomes available.

---

## 1. Current test strategy (no real Siebel required)

Every component in `packages/siebel-bridge/src/real/` is unit-tested with
mock `fetch`. No real network call is made. Tests are deterministic.

| Test file | Coverage |
|---|---|
| `RealSiebelConfig.test.ts` | Config loader, validation, `redactConfig` |
| `SiebelRestErrorMapper.test.ts` | HTTP 400/401/403/404/409/429/500/503/504, SBL-* codes, network, AbortError |
| `RetryPolicy.test.ts` | maxRetries=0, retriable, non-retriable, backoff, jitter, `runWithRetry` |
| `CircuitBreaker.test.ts` | closed/open/half_open transitions, cooldown, success recovery, failure re-open |
| `SiebelRestHttpClient.test.ts` | GET/POST/PUT/DELETE, 404 non-retriable, 500 retriable, timeout, retry, circuit breaker, no credential leak |
| `RealSiebelPayloadMapper.test.ts` | Complete payloads, field aliases, missing fields, invalid input |
| `RealSiebelAdapter.test.ts` | All SiebelBridge methods, mock fetch routing, no raw payload leak, hooks, circuit breaker + health |

The API layer is covered by `apps/api/src/real-adapter.test.ts`, which
exercises the diagnostic endpoints (`/siebel/adapter/status`,
`/siebel/adapter/config-schema`, `/siebel/adapter/endpoint-map`) and
verifies RBAC and that no credentials are exposed.

---

## 2. Mock fetch pattern

Tests use a `vi.fn` that routes URLs to canned responses:

```ts
function makeFetchReturning(routes: Record<string, { status: number; body: unknown }>): FetchLike {
  return vi.fn(async (input: string | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    for (const [pathFragment, response] of Object.entries(routes)) {
      if (url.includes(pathFragment)) {
        return makeResponse(response.status, response.body);
      }
    }
    return makeResponse(404, { message: `no mock for ${url}` });
  });
}
```

This lets each test pin the exact response for a given path, without
spinning up an HTTP server. The `Response` global (Node 22) is used
directly.

---

## 3. Deterministic time and sleep

`RetryPolicy.runWithRetry` and `CircuitBreaker` accept injectable
`nowFn`, `sleepFn` and `randomFn`. Tests pass:

- `nowFn`: a mutable counter that they advance manually.
- `sleepFn`: an `async () => {}` no-op (no real sleep).
- `randomFn`: `() => 0` for deterministic jitter.

This means tests never wait real time and never flake on `Math.random()`.

---

## 4. Testing against a real Siebel sandbox (future)

When a sandbox becomes available, follow this sequence. NEVER test against
production.

### Stage 0 — Pre-flight

- [ ] Sandbox URL confirmed.
- [ ] Read-only service account created.
- [ ] Credentials stored in `.env` (never committed).
- [ ] `LEGACYOPS_SIEBEL_ADAPTER=real` set.
- [ ] `pnpm typecheck && pnpm test && pnpm build` pass locally with `fake` mode.
- [ ] The diagnostic endpoints (`/siebel/adapter/status`) return `mode: real`.

### Stage 1 — Health check

- [ ] `GET /siebel/adapter/status` returns `mode: real`, `realConfigured: true`.
- [ ] `GET /legacy/health` returns `overall: healthy`.
- [ ] The adapter's `health()` method returns `status: up`.

If health fails, do NOT proceed. Check:

- baseUrl is reachable from the API host.
- Auth headers are correct (`Authorization: Basic ...` or `Bearer ...`).
- The healthcheck path matches the sandbox's actual health endpoint.
- Network/firewall allows the connection.

### Stage 2 — Read-only overlay

- [ ] `searchContacts({ q: 'a' })` returns an array (may be empty).
- [ ] `getContact('known-id')` returns a contact or `undefined` (404).
- [ ] `getAccount('known-id')` returns an account or `undefined`.
- [ ] `listServiceRequests({})` returns an array.
- [ ] `listBusinessObjects()` returns metadata.

If any call fails:

- Check the error code in the audit log (`external.adapter_call` events).
- Check the circuit breaker state (`/siebel/adapter/status` → `circuitState`).
- Confirm the endpoint map matches the sandbox's actual paths.

### Stage 3 — Write-back (only after stage 2 is stable)

- [ ] `createServiceRequest({...})` returns a new SR with an ID.
- [ ] `getServiceRequest(newId)` returns the SR just created.
- [ ] `invoke('BusinessService', 'Method', args)` returns a result.

### Stage 4 — Evidence capture

For each stage, capture:

- HTTP request/response pairs (redact credentials).
- Adapter call events from the audit log.
- Circuit breaker state transitions.
- Latency percentiles (p50, p95, p99).

Store the evidence in a pilot-specific location (NOT in the repo).

---

## 5. What NOT to do

- ❌ Never point `LEGACYOPS_SIEBEL_ADAPTER=real` at a production Siebel.
- ❌ Never commit `.env` with real credentials.
- ❌ Never log the `Authorization` header.
- ❌ Never copy a real Siebel response into a test fixture without
  anonymising it.
- ❌ Never disable the circuit breaker or retry policy to "make it work".
- ❌ Never close issue #4 until stage 2 passes against a real sandbox.

---

## 6. Continuous integration

The CI workflow runs:

- `pnpm test` — includes all real-adapter unit tests.
- `pnpm audit --prod --audit-level=high` — dependency vulnerabilities.
- `secret-scan-lite` — blocks obvious credential leakage.

CI does NOT run real-sandbox tests (there is no sandbox). When a sandbox
is available, a separate `siebel-sandbox` workflow can be added behind a
repository secret — but that is out of scope for this foundation.

---

## 7. Reference

- `packages/siebel-bridge/src/real/*.test.ts`
- `apps/api/src/real-adapter.test.ts`
- `docs/REAL_SIEBEL_ADAPTER.md`
- `docs/SIEBEL_SANDBOX_ONBOARDING.md`
- `docs/FAKE_SIEBEL_ERROR_MODEL.md`

# Fake Siebel Lab

> Specification of the synthetic Siebel-like backend that ships with
> LegacyOps Console. The lab makes the entire platform demonstrable
> without any real Siebel server.

---

## 1. Purpose

The Fake Siebel Lab lets LegacyOps:

- run end-to-end demos,
- train operators,
- run integration tests,
- validate the bridge contract,
- reproduce legacy integration pathologies (timeouts, session expiry,
  permission errors, conflicts, partial data),

without contacting any real backend and without any proprietary data.

---

## 2. Components

The lab lives in `packages/siebel-bridge/src/mock/`:

| File | Role |
|---|---|
| `FakeSiebelAdapter.ts` | Implements the full `SiebelBridge` contract against in-memory data. |
| `FakeSiebelSession.ts` | Session lifecycle, token expiry, scope management. |
| `FakeSiebelErrorSimulator.ts` | Deterministic simulation of integration failures. |
| `FakeSiebelMetadataProvider.ts` | Synthetic Business Objects, Integration Objects, Business Services. |

---

## 3. Synthetic data

The lab is seeded from `packages/demo-data/`. It contains:

- fake customers (residential, business, VIP),
- fake accounts,
- fake contacts,
- fake service requests,
- fake assets/products,
- fake activities,
- fake orders,
- fake business services,
- fake integration objects,
- fake server health metrics,
- fake latency and errors,
- fake permissions and session expiration.

The data is **fictional**. No real customer data is used.

---

## 4. Behaviour simulated

| Behaviour | How |
|---|---|
| External IDs | Every entity has an `externalId` field that simulates a legacy primary key. |
| Business Object / Business Component / Integration Object / Business Service | Exposed through `FakeSiebelMetadataProvider`. |
| Session / auth | `FakeSiebelSessionStore` issues 30-minute tokens, supports verify and logout. |
| Integration errors | `FakeSiebelErrorSimulator` throws `SBL-EAI-001` (timeout), `SBL-AUTH-001` (session expired), `SBL-AUTH-002` (permission denied), `SBL-DAT-001` (data conflict) at configurable rates. |
| Timeouts | Simulated through a fixed latency + jitter delay before every call. |
| Permissions | Scopes attached to sessions. |
| Partial data | `partialDataRate` simulates missing fields in responses. |
| Conflicts | `conflictRate` simulates write conflicts. |
| Session expiration | `forceExpire(token)` lets tests reproduce expired sessions deterministically. |

---

## 5. Configuration

Default error simulation config:

```ts
{
  timeoutRate: 0.03,        // 3% of calls time out
  authFailureRate: 0.0,     // 0% auth failures (controlled by tests)
  permissionDeniedRate: 0.02,
  conflictRate: 0.01,
  partialDataRate: 0.05,
  fixedLatencyMs: 120,
  jitterMs: 80
}
```

Tests and demos can override these through `FakeSiebelAdapter.configureErrors()`.

---

## 6. API surface

The lab is exposed through the API under `/siebel/mock/*`:

- `GET /siebel/mock/metadata` — business objects, integration objects,
  business services.
- `GET /siebel/mock/customers` — search contacts.
- `GET /siebel/mock/customers/:id` — contact + account + assets + orders
  + activities.
- `GET /siebel/mock/service-requests` — list SRs.
- `POST /siebel/mock/business-service/:name/invoke` — invoke a business
  service method.
- `GET /siebel/mock/health` — adapter health probe.

---

## 7. Reproducing failures in tests

```ts
const adapter = new FakeSiebelAdapter(dataset);
adapter.configureErrors({ timeoutRate: 1 }); // every call times out
await expect(adapter.searchContacts({})).rejects.toThrow();
```

```ts
const sessions = new FakeSiebelSessionStore();
const s = sessions.login('demo', 'demo');
sessions.forceExpire(s.token);
expect(sessions.verify(s.token).valid).toBe(false);
```

---

## 8. What the lab is NOT

- ❌ Not a real Siebel server.
- ❌ Not a copy of any proprietary Siebel schema.
- ❌ Not suitable as a production backend.
- ❌ Not a substitute for a real adapter integration test.

---

## 9. Reference

- `packages/siebel-bridge/src/mock/`
- `packages/demo-data/` — dataset factory.
- `apps/api/src/routes/siebel.ts` — HTTP endpoints.
- `apps/web/src/pages/SiebelBridgeLabPage.tsx` — interactive lab UI.

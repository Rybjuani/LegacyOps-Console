# UI Screenshots

> How to capture reproducible screenshots of the LegacyOps Console web UI.

---

## 1. Why no automated screenshots yet

Automated screenshots via Playwright were considered for this cycle, but
adding `@playwright/test` and browser binaries would significantly
increase CI install time and dependency surface. The team decided to
defer automated screenshots to a future cycle and document the manual
flow instead.

This file documents:

- how to run the API + web locally
- which pages to capture
- what each screenshot should demonstrate

---

## 2. Prerequisites

```bash
pnpm install --frozen-lockfile
pnpm build
```

Two terminals are needed (one for the API, one for the web dev server).

---

## 3. Start the stack

Terminal 1 — API:

```bash
pnpm dev:api
# listens on http://localhost:3001
```

Terminal 2 — Web:

```bash
pnpm dev:web
# listens on http://localhost:5173
```

Open `http://localhost:5173` in a browser. The web client proxies `/api`
to `http://localhost:3001` automatically (see `apps/web/vite.config.ts`).

The web client sends `x-legacyops-role: admin` so every panel is
accessible without authentication (demo-only; see `SECURITY.md`).

---

## 4. Pages to capture

Capture each page at 1440×900 (or equivalent) with the sidebar visible.

| # | Page | URL | What it demonstrates |
|---|------|-----|----------------------|
| 1 | Dashboard / Home | `/dashboard` | KPIs, operator flow CTA, legacy readiness, "why this matters" |
| 2 | Interaction Console | `/interaction-console` | 7-step guided flow, summary panel, audit summary |
| 3 | Customer Search | `/customers` | Search filters, results table with risk badges |
| 4 | Customer 360 | `/customers/cust_res_1` | Identity, account, services, billing, cases, timeline, risk, data-source badges |
| 5 | Cases | `/cases` | Filters + case list with priority/status pills |
| 6 | Workflows | `/workflows` | Available workflows, stepper, run list |
| 7 | Supervisor | `/supervisor` | KPIs, by-status, by-category |
| 8 | Siebel Bridge Lab | `/siebel-bridge` | Business Objects, Integration Objects, Business Services, invoker (Technical banner) |
| 9 | Legacy Observability | `/legacy-observability` | Component health, latency, errors (Technical banner) |
| 10 | Migration Dry Run | `/migration` | Plan, field mapping, dry-run, reconciliation, rollback (Technical banner) |
| 11 | Source of Truth | `/source-of-truth` | Source systems, registry, module statuses (Technical banner) |
| 12 | ROI Metrics | `/roi` | Before/after KPIs, assumptions |
| 13 | Integration Mode | `/mode` | 7 modes with descriptions (Technical banner) |

---

## 5. Interaction Console flow screenshot

For a richer screenshot of the Interaction Console, walk through the flow
before capturing:

1. Open `/interaction-console`.
2. Select a customer (e.g. `cust_res_1`).
3. Choose channel `voice`.
4. Click "Start interaction".
5. Tick "Identity verified", click "Continue".
6. Choose reason `billing_claim`, click "Continue".
7. Pick workflow `Billing Claim`, click "Start workflow".
8. Click "Create case".
9. Add a note, click "Save note & continue".
10. Choose outcome `Resolved`, click "Close interaction".

Capture the final state: the Summary panel shows customer/channel/reason/
workflow/case ID/status, and the Audit summary lists every audited step.

---

## 6. Suggested file naming

```
screenshots/
├── 01-dashboard.png
├── 02-interaction-console.png
├── 03-customer-search.png
├── 04-customer-360.png
├── 05-cases.png
├── 06-workflows.png
├── 07-supervisor.png
├── 08-siebel-bridge-lab.png
├── 09-legacy-observability.png
├── 10-migration-dry-run.png
├── 11-source-of-truth.png
├── 12-roi-metrics.png
└── 13-integration-mode.png
```

Screenshots should NOT be committed to the repo (they are large binaries
and change frequently). Store them in an external location (wiki, drive,
design tool) and link to them from sales material.

---

## 7. Future: automated screenshots with Playwright

When automated screenshots are added, the suggested setup is:

- `@playwright/test` as a devDependency in `apps/web`.
- `apps/web/playwright.config.ts` with a single project (chromium).
- `apps/web/tests/screenshots.spec.ts` that navigates to each page and
  calls `page.screenshot({ path: 'screenshots/NN-page.png' })`.
- A `pnpm screenshot:web` script that:
  1. starts the API in the background (`pnpm dev:api &`)
  2. starts the web preview server (`pnpm --filter @legacyops/web preview &`)
  3. waits for both to be ready
  4. runs `pnpm --filter @legacyops/web exec playwright test`
  5. kills the background processes
- The CI workflow should NOT run screenshots by default — only on demand
  or on a dedicated `screenshots` job that does not block `verify`.

This is a tracked TODO for a future cycle. Do not block CI on browser
binary downloads.

---

## 8. Reference

- `apps/web/vite.config.ts` — dev server proxy configuration.
- `apps/web/src/components/ui.tsx` — common UI primitives.
- `docs/MVP_DEFINITION.md` — the 11-step MVP demo flow.
- `docs/SALES_DEMO_SCRIPT.md` — 30-minute demo script.

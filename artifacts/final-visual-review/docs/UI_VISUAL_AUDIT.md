# UI Visual Audit

> Visual audit of the LegacyOps Console web UI, based on real screenshots
> captured at 1440×900 with Playwright + Chromium. Each screenshot was
> analyzed for layout clarity, visible errors, jargon, and overall polish.
>
> Screenshots are NOT committed to the repo (they are binary artifacts that
> change frequently). They live in `artifacts/screenshots/` (gitignored) and
> can be regenerated with `pnpm screenshot:web`.

---

## 1. Method

- **Tool**: Playwright + Chromium (headless).
- **Viewport**: 1440×900.
- **Capture**: `apps/web/tests/screenshots.spec.ts` — 14 tests, one per page.
- **Script**: `pnpm screenshot:web` (or `bash scripts/screenshot-web.sh`).
- **Analysis**: Each screenshot was reviewed with a vision model for layout,
  errors, jargon, and enterprise polish.

---

## 2. Audit results

| # | Page | Screenshot | Verdict | Findings | Recommended fix |
|---|------|------------|---------|----------|-----------------|
| 01 | Dashboard / Home | `01-dashboard.png` | ✅ Pass | Layout clear. KPIs, operator flow CTA, legacy readiness card, "why this matters" banner all render. Jargon ("Legacy readiness", "Siebel Bridge Lab") is contextually appropriate. Looks enterprise modern. | None. |
| 02 | Interaction Console (initial) | `02-interaction-console-initial.png` | ✅ Pass | Steps stepper, form, summary panel well-organized. "Recommended workflow" and "auditable case" slightly technical but acceptable for guided flow. Modern dark theme. | None. |
| 02b | Interaction Console (final) | `02b-interaction-console-final.png` | ✅ Pass | Full 7-step flow completed. Summary panel shows customer/channel/reason/workflow/case ID/status. Audit summary lists every audited step. Success banner visible. "Interaction closed" banner may visually conflict with active step indicators, but not a blocking issue. | Consider greying out completed steps more distinctly. |
| 03 | Customer Search | `03-customer-search.png` | ✅ Pass | Search filters and results table render. Empty state ("No customers found") shown correctly before search. Modern dark theme. | None. |
| 04 | Customer 360 | `04-customer-360.png` | ✅ Pass | Sections (Identity, Account, Services/Assets, Billing, Open Cases, Recent Interactions, Risk Signals) all render with data-source badges. "Native/Legacy/Mapped" badges are consistent. Jargon is present but explained by the help text. | None. |
| 05 | Cases | `05-cases.png` | ✅ Pass | Filter bar + case table render. Priority/status pills are color-coded. Sidebar navigation visible. | None. |
| 06 | Workflows | `06-workflows.png` | ✅ Pass | Available workflows list, start-run form, step preview, recent runs table all render. Clean cards. | None. |
| 07 | Supervisor | `07-supervisor.png` | ✅ Pass | KPI cards (open cases, escalations, customers, audit) + by-status and by-category tables render. Clean. | None. |
| 08 | Siebel Bridge Lab | `08-siebel-bridge-lab.png` | ✅ Pass | Business Objects, Integration Objects, Business Services columns render. Contacts table and BS invoker visible. Technical banner present. Jargon ("Anti-corruption layer", "DTOs") is appropriate for the technical audience. | None. |
| 09 | Legacy Observability | `09-legacy-observability.png` | ✅ Pass | System health, legacy metrics, adapter latency, recent errors sections all render. Component status pills color-coded. | None. |
| 10 | Migration Dry Run | `10-migration-dry-run.png` | ✅ Pass | Plan details, field mapping table, dry-run/reconciliation panels render. Technical banner present. Jargon ("dual-write", "reconcile") is appropriate for the audience. | None. |
| 11 | Source of Truth | `11-source-of-truth.png` | ✅ Pass | Source systems cards, registry table, module status table render. Technical banner present. | None. |
| 12 | ROI Metrics | `12-roi-metrics.png` | ✅ Pass | KPI cards (AHT, FCR, escalations, training, screens, clicks, hours, savings), before/after table, assumptions list all render. | None. |
| 13 | Integration Mode | `13-integration-mode.png` | ✅ Pass | 7 mode cards in a 2-column grid render. Technical banner present. Descriptions are clear. | None. |

---

## 3. Summary

- **14/14 pages pass** the visual audit.
- **0 critical UI bugs** found.
- **0 broken layouts** detected.
- **0 visible API errors** on any page.
- **0 empty states missing** where data should be present.
- All pages render with the dark enterprise theme, consistent sidebar
  navigation, and the new three-group organization (Daily Operations /
  Supervision / Technical / Legacy).
- Jargon is present on Technical / Legacy pages, which is appropriate for
  the developer/auditor audience. Daily Operations and Supervision pages
  use operator-friendly language.

---

## 4. Minor observations (not blocking)

1. **Interaction Console (final)**: The "Interaction closed" success banner
   may visually compete with the active step indicator. Consider greying
   out completed steps more distinctly in a future cycle.
2. **Customer 360**: The "Native/Legacy/Mapped" badges are clear but could
   benefit from a one-line legend at the top of the page (the help text
   is currently below the badges).
3. **Customer Search**: The initial empty state is correct, but a hint to
   "click Search to load customers" could improve first-time UX.

---

## 5. How to regenerate screenshots

```bash
pnpm screenshot:web
```

This script:
1. Builds all packages, the API and the web app.
2. Starts the API on `:3001`.
3. Starts the web preview server on `:5174`.
4. Runs the Playwright screenshot spec (14 tests).
5. Writes PNGs to `artifacts/screenshots/`.
6. Stops both servers.

Prerequisites:
- `pnpm install --frozen-lockfile`
- Playwright Chromium installed (`npx playwright install chromium`)

---

## 6. Reference

- `apps/web/tests/screenshots.spec.ts` — Playwright spec.
- `apps/web/playwright.config.ts` — Playwright config.
- `scripts/screenshot-web.sh` — capture script.
- `docs/UI_SCREENSHOTS.md` — manual screenshot documentation.

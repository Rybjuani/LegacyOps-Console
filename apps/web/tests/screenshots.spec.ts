import { test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);
const SHOT_DIR = path.resolve(__dirname_esm, '../../../artifacts/screenshots');

/**
 * Navigate to a path, wait for the main content to be present, then
 * capture a full-page screenshot at 1440x900.
 */
async function capture(page: Page, name: string, path: string) {
  await page.goto(path);
  // Wait for the main content area to render at least one element.
  await page.waitForSelector('.main', { timeout: 10_000 });
  // Give panels a moment to fetch and render.
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
}

test.describe('LegacyOps Console screenshots', () => {
  test('01 Dashboard', async ({ page }) => {
    await capture(page, '01-dashboard', '/dashboard');
  });

  test('02 Interaction Console (initial)', async ({ page }) => {
    await capture(page, '02-interaction-console-initial', '/interaction-console');
  });

  test('02b Interaction Console (final)', async ({ page }) => {
    await page.goto('/interaction-console');
    await page.waitForSelector('.main');

    // Wait for the customer <select> to appear (the page shows "Loading…"
    // until customers + workflows have been fetched from the API).
    await page.waitForSelector('select', { timeout: 15_000 });
    await page.waitForTimeout(500);

    // Step 1: select customer — pick the first non-empty option by value.
    const customerSelect = page.locator('select').first();
    const optionValues = await customerSelect
      .locator('option')
      .evaluateAll((opts) => opts.map((o) => o.value).filter((v) => v.length > 0));
    if (optionValues.length === 0) {
      throw new Error('No customer options available for screenshot flow');
    }
    await customerSelect.selectOption(optionValues[0]);
    await page.waitForTimeout(300);

    // The "Start interaction" button is disabled until a customer is selected.
    await page.getByRole('button', { name: /start interaction/i }).click();
    await page.waitForTimeout(1000);

    // Step 2: verify identity
    await page.getByLabel(/identity verified/i).check();
    await page
      .getByRole('button', { name: /continue/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Step 3: choose reason (billing_claim is default); continue
    await page
      .getByRole('button', { name: /continue/i })
      .first()
      .click();
    await page.waitForTimeout(500);

    // Step 4: recommended workflow — the workflow select is the one inside
    // the panel that contains a "Start workflow" button. We locate it by
    // looking for the select whose options include workflow ids (wf_*).
    const allSelects = page.locator('select');
    const count = await allSelects.count();
    let wfSelected = false;
    for (let i = 0; i < count; i++) {
      const sel = allSelects.nth(i);
      const vals = await sel
        .locator('option')
        .evaluateAll((opts) => opts.map((o) => o.value).filter((v) => v.length > 0));
      if (vals.some((v) => v.startsWith('wf_'))) {
        await sel.selectOption(vals[0]);
        await page.waitForTimeout(300);
        wfSelected = true;
        break;
      }
    }
    if (!wfSelected) {
      // Skip workflow step if no workflow select found
      await page.getByRole('button', { name: /skip workflow/i }).click();
    } else {
      await page.getByRole('button', { name: /start workflow/i }).click();
    }
    await page.waitForTimeout(1000);

    // Step 5: create case
    await page.getByRole('button', { name: /create case/i }).click();
    await page.waitForTimeout(1000);

    // Step 6: add note
    await page.getByPlaceholder(/optional/i).fill('Screenshot test note');
    await page.getByRole('button', { name: /save note/i }).click();
    await page.waitForTimeout(1000);

    // Step 7: close
    await page.getByRole('button', { name: /close interaction/i }).click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: `${SHOT_DIR}/02b-interaction-console-final.png`, fullPage: false });
  });

  test('03 Customer Search', async ({ page }) => {
    await capture(page, '03-customer-search', '/customers');
  });

  test('04 Customer 360', async ({ page }) => {
    await capture(page, '04-customer-360', '/customers/cust_res_1');
  });

  test('05 Cases', async ({ page }) => {
    await capture(page, '05-cases', '/cases');
  });

  test('06 Workflows', async ({ page }) => {
    await capture(page, '06-workflows', '/workflows');
  });

  test('07 Supervisor', async ({ page }) => {
    await capture(page, '07-supervisor', '/supervisor');
  });

  test('08 Siebel Bridge Lab', async ({ page }) => {
    await capture(page, '08-siebel-bridge-lab', '/siebel-bridge');
  });

  test('09 Legacy Observability', async ({ page }) => {
    await capture(page, '09-legacy-observability', '/legacy-observability');
  });

  test('10 Migration Dry Run', async ({ page }) => {
    await capture(page, '10-migration-dry-run', '/migration');
  });

  test('11 Source of Truth', async ({ page }) => {
    await capture(page, '11-source-of-truth', '/source-of-truth');
  });

  test('12 ROI Metrics', async ({ page }) => {
    await capture(page, '12-roi-metrics', '/roi');
  });

  test('13 Integration Mode', async ({ page }) => {
    await capture(page, '13-integration-mode', '/mode');
  });
});

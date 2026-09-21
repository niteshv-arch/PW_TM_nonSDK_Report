// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://ecommbs-prod.vercel.app';

/**
 * Helper: runs a test.step(), emitting [[PROPERTY|step[passed]=...]] on success
 * or [[PROPERTY|step[failure]=...]] on failure (then re-throws so the test fails).
 */
async function trackedStep(/** @type {string} */ name, /** @type {() => Promise<void>} */ fn) {
  try {
    await test.step(name, fn);
    console.log(`[[PROPERTY|step[passed]=${name}]]`);
  } catch (err) {
    console.log(`[[PROPERTY|step[failure]=${name}]]`);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-03: Footer Shop links navigate to correct category pages
// Footer DOM observed: footer contentinfo > div > div[2] > nav > button
// Shop section heading: h4 "Shop" (main-910 in session snapshot)
// Shop nav buttons observed (main-905 to main-909):
//   "New Arrivals" → /category-new-arrivals  (confirmed step 4)
//   "Women"        → /category-women         (confirmed step 10)
//   "Men"          → /category-men           (URL pattern)
//   "Kids"         → /category-kids          (URL pattern)
//   "Sale"         → /category-sale          (URL pattern)
// ─────────────────────────────────────────────────────────────────────────────
const FOOTER_SHOP_LINKS = [
  { label: 'New Arrivals', expectedUrl: '/category/new-arrivals' },
  { label: 'Women',        expectedUrl: '/category/women' },
  { label: 'Men',          expectedUrl: '/category/men' },
  { label: 'Kids',         expectedUrl: '/category/kids' },
  { label: 'Sale',         expectedUrl: '/category/sale' },
];

for (const { label, expectedUrl } of FOOTER_SHOP_LINKS) {
  test(`Footer Shop link "${label}" navigates to correct page TC-15736`, async ({ page }, testInfo) => {
    
    await trackedStep('Navigate to FashionStack homepage', async () => {
      await page.goto(BASE_URL);
    });

    await trackedStep('Verify homepage loaded', async () => {
      await expect(page).toHaveTitle(/Ecommerce Clothing Brand/i);
    });

    await trackedStep(`Scroll to footer and click Shop link "${label}"`, async () => {
      // Footer Shop nav buttons observed in DOM snapshot (step 9, session 1):
      // footer contentinfo > div[3] > div[1] > div[2] > nav > button[text=label]
      // Using CSS nth-of-type to target the Shop nav (first nav inside the footer links column)
      const shopLink = page.locator('footer').getByRole('button', { name: label, exact: true }).last();
      await shopLink.scrollIntoViewIfNeeded();
      await shopLink.click();
    });

    await trackedStep(`Verify URL navigated to "${expectedUrl}"`, async () => {
      await expect(page).toHaveURL(new RegExp(expectedUrl));
    });
  });
}
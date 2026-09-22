# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: footer-shop.spec.js >> Footer Shop link "Sale" navigates to correct page TC-15736
- Location: tests/footer-shop.spec.js:40:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/category\/sale/
Received string:  "https://ecommbs-prod.vercel.app/category-sale"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "https://ecommbs-prod.vercel.app/category-sale"

```

```yaml
- main
```

# Test source

```ts
  1  | // @ts-check
  2  | const { test, expect } = require('@playwright/test');
  3  | 
  4  | const BASE_URL = 'https://ecommbs-prod.vercel.app';
  5  | 
  6  | /**
  7  |  * Helper: runs a test.step(), emitting [[PROPERTY|step[passed]=...]] on success
  8  |  * or [[PROPERTY|step[failure]=...]] on failure (then re-throws so the test fails).
  9  |  */
  10 | async function trackedStep(/** @type {string} */ name, /** @type {() => Promise<void>} */ fn) {
  11 |   try {
  12 |     await test.step(name, fn);
  13 |     console.log(`[[PROPERTY|step[passed]=${name}]]`);
  14 |   } catch (err) {
  15 |     console.log(`[[PROPERTY|step[failure]=${name}]]`);
  16 |     throw err;
  17 |   }
  18 | }
  19 | 
  20 | // ─────────────────────────────────────────────────────────────────────────────
  21 | // TC-03: Footer Shop links navigate to correct category pages
  22 | // Footer DOM observed: footer contentinfo > div > div[2] > nav > button
  23 | // Shop section heading: h4 "Shop" (main-910 in session snapshot)
  24 | // Shop nav buttons observed (main-905 to main-909):
  25 | //   "New Arrivals" → /category-new-arrivals  (confirmed step 4)
  26 | //   "Women"        → /category-women         (confirmed step 10)
  27 | //   "Men"          → /category-men           (URL pattern)
  28 | //   "Kids"         → /category-kids          (URL pattern)
  29 | //   "Sale"         → /category-sale          (URL pattern)
  30 | // ─────────────────────────────────────────────────────────────────────────────
  31 | const FOOTER_SHOP_LINKS = [
  32 |   { label: 'New Arrivals', expectedUrl: '/category/new-arrivals' },
  33 |   { label: 'Women',        expectedUrl: '/category/women' },
  34 |   { label: 'Men',          expectedUrl: '/category/men' },
  35 |   { label: 'Kids',         expectedUrl: '/category/kids' },
  36 |   { label: 'Sale',         expectedUrl: '/category/sale' },
  37 | ];
  38 | 
  39 | for (const { label, expectedUrl } of FOOTER_SHOP_LINKS) {
  40 |   test(`Footer Shop link "${label}" navigates to correct page TC-15736`, async ({ page }, testInfo) => {
  41 |     
  42 |     await trackedStep('Navigate to FashionStack homepage', async () => {
  43 |       await page.goto(BASE_URL);
  44 |     });
  45 | 
  46 |     await trackedStep('Verify homepage loaded', async () => {
  47 |       await expect(page).toHaveTitle(/Ecommerce Clothing Brand/i);
  48 |     });
  49 | 
  50 |     await trackedStep(`Scroll to footer and click Shop link "${label}"`, async () => {
  51 |       // Footer Shop nav buttons observed in DOM snapshot (step 9, session 1):
  52 |       // footer contentinfo > div[3] > div[1] > div[2] > nav > button[text=label]
  53 |       // Using CSS nth-of-type to target the Shop nav (first nav inside the footer links column)
  54 |       const shopLink = page.locator('footer').getByRole('button', { name: label, exact: true }).last();
  55 |       await shopLink.scrollIntoViewIfNeeded();
  56 |       await shopLink.click();
  57 |     });
  58 | 
  59 |     await trackedStep(`Verify URL navigated to "${expectedUrl}"`, async () => {
> 60 |       await expect(page).toHaveURL(new RegExp(expectedUrl));
     |                          ^ Error: expect(page).toHaveURL(expected) failed
  61 |     });
  62 |   });
  63 | }
```
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

//Required when using standard Playwright Junit report
// test.beforeEach(async ({}, testInfo) => {
//   const metadata = testInfo.project.metadata;

//   if (metadata) {
//     if (metadata.os) {
//       testInfo.annotations.push({ type: 'os', description: String(metadata.os) });
//     }
//     if (metadata.os_version) {
//       testInfo.annotations.push({ type: 'os_version', description: String(metadata.os_version) });
//     }
//     if (metadata.device) {
//       testInfo.annotations.push({ type: 'device', description: String(metadata.device) });
//     }
//     if (metadata.browser) {
//       testInfo.annotations.push({ type: 'browser', description: String(metadata.browser) });
//     }
//   } else {
//     // Fallback: If no metadata is defined, map from project name or default configs
//     testInfo.annotations.push({ type: 'browser', description: testInfo.project.name });
//   }
// });
// ─────────────────────────────────────────────────────────────────────────────
// TC-01: Homepage loads with hero banner and featured products (Parameterized)
// ─────────────────────────────────────────────────────────────────────────────
const NAV_LABELS = ['New', 'Men', 'Women', 'Sale', 'Offers'];

for (const each of NAV_LABELS) {
  test(`${each} Navigation is visible @test TC-15442`, async ({ page }, testInfo) => {
    //console.log(`[[PROPERTY|id=TC-15442]]`);
    // const { name: tagName, metadata: meta } = testInfo.project;
    // console.log(`[[PROPERTY|os=${meta.os}]]`);
    // console.log(`[[PROPERTY|os_version=${meta.os_version}]]`);
    // console.log(`[[PROPERTY|browser=${tagName}]]`);
    // console.log(`[[PROPERTY|test_data=${each}]]`);

    await trackedStep(`Navigate to FashionStack homepage for nav label: ${each}`, async () => {
      await page.goto(BASE_URL);
    });

    await trackedStep('Verify page title', async () => {
      await expect(page).toHaveTitle(/Ecommerce Clothing Brand/i);
    });

    await trackedStep('Verify hero banner heading is visible', async () => {
      const heroHeading = page.locator('h2').filter({ hasText: 'Summer Collection 2024' });
      await expect(heroHeading).toBeVisible();
    });

    await trackedStep(`Verify nav button "${each}" is present`, async () => {
      await expect(page.locator('button').filter({ hasText: each }).first()).toBeVisible();
    });

    await trackedStep('Verify search input is present', async () => {
      await expect(page.getByPlaceholder('Search...')).toBeVisible();
    });

    await trackedStep('Verify Login button is present', async () => {
      await expect(page.locator('#login')).toBeVisible();
    });

    await trackedStep('Verify "Featured Products" section heading is visible', async () => {
      const featuredHeading = page.locator('h2').filter({ hasText: 'Featured Products' });
      await expect(featuredHeading).toBeVisible();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-02: Add product to cart updates cart badge
// ─────────────────────────────────────────────────────────────────────────────
test('Add product to cart updates cart badge TC-15443', async ({ page }, testInfo) => {
  //console.log(`[[PROPERTY|id=TC-15443]]`);
  // const { name: tagName, metadata: meta } = testInfo.project;
  // console.log(`[[PROPERTY|browser=${tagName}]]`);
  // //console.log(`[[PROPERTY|device=${meta.device}]]`);
  // console.log(`[[PROPERTY|os=${meta.os}]]`);
  // console.log(`[[PROPERTY|os_version=${meta.os_version}]]`);

  await trackedStep("Navigate to Men's category page", async () => {
    await page.goto(`${BASE_URL}/category/men`);
  });

  await trackedStep("Verify Men's Fashion page loaded", async () => {
    const mensHeading = page.locator('h1').filter({ hasText: "Men's Fashion" });
    await expect(mensHeading).toBeVisible();
  });

  await trackedStep('Navigate to Polo Shirt product page', async () => {
    await page.goto(`${BASE_URL}/product/21`);
  });

  await trackedStep('Verify product detail page loaded', async () => {
    const productHeading = page.locator('h1').filter({ hasText: 'Polo Shirt' });
    await expect(productHeading).toBeVisible();
  });

  await trackedStep('Click "Add to Cart" button', async () => {
    await page.locator('button.cyan-glow').filter({ hasText: 'Add to Cart' }).click();
  });

  await trackedStep('Wait for cart badge to update', async () => {
    await page.waitForTimeout(1500);
  });

  await trackedStep('Verify cart badge shows count "1"', async () => {
    await expect(page.getByRole('button', { name: '1' })).toBeVisible();
  });

  await trackedStep('Click cart badge to open cart page', async () => {
    await page.getByRole('button', { name: '1' }).click();
  });

  await trackedStep('Verify Shopping Cart page loaded', async () => {
    await expect(page).toHaveURL(/\/cart/);
    const cartHeading = page.locator('h1').filter({ hasText: 'Shopping Cart' });
    await expect(cartHeading).toBeVisible();
  });

  await trackedStep('Verify Polo Shirt appears in cart', async () => {
    const cartItem = page.locator('h3').filter({ hasText: 'Polo Shirt' });
    await expect(cartItem).toBeVisible();
  });

  await trackedStep('Verify "Proceed to Checkout" button is present', async () => {
    const checkoutBtn = page.locator('button').filter({ hasText: 'Proceed to Checkout' });
    await expect(checkoutBtn).toBeVisible();
  });
});
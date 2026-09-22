# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fashionstack.spec.js >> Sale Navigation is visible @test TC-15442
- Location: tests/fashionstack.spec.js:48:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button').filter({ hasText: 'Sale' }).first()
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'Sale' }).first()
    14 × locator resolved to <button data-slot="button" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-accent/50 h-9 has-[>svg]:px-3 text-[#2228…>Sale</button>
       - unexpected value "hidden"

```

```yaml
- banner:
  - paragraph: Free shipping worldwide on orders over $50 • Summer Sale up to 40% off
  - button "FashionStack Logo FashionStack":
    - img "FashionStack Logo"
    - heading "FashionStack" [level=1]
  - switch
  - button:
    - img
  - button:
    - img
  - button:
    - img
  - button:
    - img
  - img
  - textbox "Search products..."
- main:
  - paragraph: Fresh styles for the season
  - heading "Summer Collection 2024" [level=2]
  - paragraph: Discover our latest summer arrivals featuring breathable fabrics, vibrant colors, and timeless designs.
  - img "Summer Collection 2024"
  - paragraph: Less is more
  - heading "Minimalist Essentials" [level=2]
  - paragraph: Curated basics that form the foundation of your wardrobe. Quality materials, perfect fits, endless possibilities.
  - img "Minimalist Essentials"
  - paragraph: Crafted to perfection
  - heading "Premium Denim" [level=2]
  - paragraph: Experience our heritage denim collection, featuring sustainable materials and artisanal craftsmanship.
  - img "Premium Denim"
  - button:
    - img
  - button:
    - img
  - button
  - button
  - button
  - paragraph: Curated Selection
  - heading "Featured Products" [level=2]
  - paragraph: Discover our handpicked selection of premium clothing and accessories, crafted with attention to detail and timeless style.
  - img "Silk Wrap Dress"
  - text: Sale Dresses
  - button:
    - img
  - img
  - text: 4.8 (124 reviews)
  - heading "Silk Wrap Dress" [level=3]
  - text: $189.99 $249.99
  - button "View Details":
    - img
    - text: View Details
  - img "Heritage Denim Jacket"
  - text: Outerwear
  - button:
    - img
  - img
  - text: 4.6 (89 reviews)
  - heading "Heritage Denim Jacket" [level=3]
  - text: $159.99
  - button "View Details":
    - img
    - text: View Details
  - heading "More Products" [level=3]
  - img "Essential Cotton Tee"
  - text: Sale
  - button:
    - img
  - heading "Essential Cotton Tee" [level=3]
  - img
  - text: 4.9 (256) $39.99 $59.99
  - button "View Details":
    - img
    - text: View Details
  - img "Leather Crossbody Bag"
  - button:
    - img
  - heading "Leather Crossbody Bag" [level=3]
  - img
  - text: 4.7 (67) $149.99
  - button "View Details":
    - img
    - text: View Details
  - img "Straight Leg Jeans"
  - text: Sale
  - button:
    - img
  - heading "Straight Leg Jeans" [level=3]
  - img
  - text: 4.5 (178) $129.99 $179.99
  - button "View Details":
    - img
    - text: View Details
  - img "Linen Button Shirt"
  - button:
    - img
  - heading "Linen Button Shirt" [level=3]
  - img
  - text: 4.4 (92) $89.99
  - button "View Details":
    - img
    - text: View Details
- contentinfo:
  - img
  - heading "Free Shipping" [level=4]
  - paragraph: On orders over $50
  - img
  - heading "Easy Returns" [level=4]
  - paragraph: 30-day return policy
  - img
  - heading "Secure Payment" [level=4]
  - paragraph: SSL encrypted checkout
  - img
  - heading "Payment Options" [level=4]
  - paragraph: Multiple payment methods
  - heading "Stay in Style" [level=3]
  - paragraph: Get the latest fashion updates, exclusive offers, and style tips delivered to your inbox.
  - img
  - textbox "Enter your email address"
  - button "Subscribe":
    - text: Subscribe
    - img
  - paragraph: By subscribing, you agree to our Privacy Policy and Terms of Service.
  - heading "FashionStack" [level=3]
  - paragraph: Your premier destination for contemporary fashion. We curate high-quality clothing and accessories that blend timeless elegance with modern trends.
  - img
  - text: 123 Fashion Avenue, New York, NY 10001
  - img
  - text: +1 (555) 123-4567
  - img
  - text: support@fashionstack.com
  - button:
    - img
  - button:
    - img
  - button:
    - img
  - button:
    - img
  - heading "Shop" [level=4]
  - navigation:
    - button "New Arrivals"
    - button "Women"
    - button "Men"
    - button "Kids"
    - button "Sale"
  - heading "Support" [level=4]
  - navigation:
    - button "FAQ"
    - button "Help Center"
    - button "Shipping Info"
    - button "Track Order"
  - heading "Company" [level=4]
  - navigation:
    - button "About Us"
  - paragraph: © 2026 FashionStack. All rights reserved.
  - button "Privacy Policy"
  - button "Terms of Service"
  - button "Contact Us"
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require('@playwright/test');
  3   | 
  4   | const BASE_URL = 'https://ecommbs-prod.vercel.app';
  5   | 
  6   | /**
  7   |  * Helper: runs a test.step(), emitting [[PROPERTY|step[passed]=...]] on success
  8   |  * or [[PROPERTY|step[failure]=...]] on failure (then re-throws so the test fails).
  9   |  */
  10  | async function trackedStep(/** @type {string} */ name, /** @type {() => Promise<void>} */ fn) {
  11  |   try {
  12  |     await test.step(name, fn);
  13  |     console.log(`[[PROPERTY|step[passed]=${name}]]`);
  14  |   } catch (err) {
  15  |     console.log(`[[PROPERTY|step[failure]=${name}]]`);
  16  |     throw err;
  17  |   }
  18  | }
  19  | 
  20  | //Required when using standard Playwright Junit report
  21  | // test.beforeEach(async ({}, testInfo) => {
  22  | //   const metadata = testInfo.project.metadata;
  23  | 
  24  | //   if (metadata) {
  25  | //     if (metadata.os) {
  26  | //       testInfo.annotations.push({ type: 'os', description: String(metadata.os) });
  27  | //     }
  28  | //     if (metadata.os_version) {
  29  | //       testInfo.annotations.push({ type: 'os_version', description: String(metadata.os_version) });
  30  | //     }
  31  | //     if (metadata.device) {
  32  | //       testInfo.annotations.push({ type: 'device', description: String(metadata.device) });
  33  | //     }
  34  | //     if (metadata.browser) {
  35  | //       testInfo.annotations.push({ type: 'browser', description: String(metadata.browser) });
  36  | //     }
  37  | //   } else {
  38  | //     // Fallback: If no metadata is defined, map from project name or default configs
  39  | //     testInfo.annotations.push({ type: 'browser', description: testInfo.project.name });
  40  | //   }
  41  | // });
  42  | // ─────────────────────────────────────────────────────────────────────────────
  43  | // TC-01: Homepage loads with hero banner and featured products (Parameterized)
  44  | // ─────────────────────────────────────────────────────────────────────────────
  45  | const NAV_LABELS = ['New', 'Men', 'Women', 'Sale', 'Offers'];
  46  | 
  47  | for (const each of NAV_LABELS) {
  48  |   test(`${each} Navigation is visible @test TC-15442`, async ({ page }, testInfo) => {
  49  |     //console.log(`[[PROPERTY|id=TC-15442]]`);
  50  |     // const { name: tagName, metadata: meta } = testInfo.project;
  51  |     // console.log(`[[PROPERTY|os=${meta.os}]]`);
  52  |     // console.log(`[[PROPERTY|os_version=${meta.os_version}]]`);
  53  |     // console.log(`[[PROPERTY|browser=${tagName}]]`);
  54  |     // console.log(`[[PROPERTY|test_data=${each}]]`);
  55  | 
  56  |     await trackedStep(`Navigate to FashionStack homepage for nav label: ${each}`, async () => {
  57  |       await page.goto(BASE_URL);
  58  |     });
  59  | 
  60  |     await trackedStep('Verify page title', async () => {
  61  |       await expect(page).toHaveTitle(/Ecommerce Clothing Brand/i);
  62  |     });
  63  | 
  64  |     await trackedStep('Verify hero banner heading is visible', async () => {
  65  |       const heroHeading = page.locator('h2').filter({ hasText: 'Summer Collection 2024' });
  66  |       await expect(heroHeading).toBeVisible();
  67  |     });
  68  | 
  69  |     await trackedStep(`Verify nav button "${each}" is present`, async () => {
> 70  |       await expect(page.locator('button').filter({ hasText: each }).first()).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  71  |     });
  72  | 
  73  |     await trackedStep('Verify search input is present', async () => {
  74  |       await expect(page.getByPlaceholder('Search...')).toBeVisible();
  75  |     });
  76  | 
  77  |     await trackedStep('Verify Login button is present', async () => {
  78  |       await expect(page.locator('#login')).toBeVisible();
  79  |     });
  80  | 
  81  |     await trackedStep('Verify "Featured Products" section heading is visible', async () => {
  82  |       const featuredHeading = page.locator('h2').filter({ hasText: 'Featured Products' });
  83  |       await expect(featuredHeading).toBeVisible();
  84  |     });
  85  |   });
  86  | }
  87  | 
  88  | // ─────────────────────────────────────────────────────────────────────────────
  89  | // TC-02: Add product to cart updates cart badge
  90  | // ─────────────────────────────────────────────────────────────────────────────
  91  | test('Add product to cart updates cart badge TC-15443', async ({ page }, testInfo) => {
  92  |   //console.log(`[[PROPERTY|id=TC-15443]]`);
  93  |   // const { name: tagName, metadata: meta } = testInfo.project;
  94  |   // console.log(`[[PROPERTY|browser=${tagName}]]`);
  95  |   // //console.log(`[[PROPERTY|device=${meta.device}]]`);
  96  |   // console.log(`[[PROPERTY|os=${meta.os}]]`);
  97  |   // console.log(`[[PROPERTY|os_version=${meta.os_version}]]`);
  98  | 
  99  |   await trackedStep("Navigate to Men's category page", async () => {
  100 |     await page.goto(`${BASE_URL}/category/men`);
  101 |   });
  102 | 
  103 |   await trackedStep("Verify Men's Fashion page loaded", async () => {
  104 |     const mensHeading = page.locator('h1').filter({ hasText: "Men's Fashion" });
  105 |     await expect(mensHeading).toBeVisible();
  106 |   });
  107 | 
  108 |   await trackedStep('Navigate to Polo Shirt product page', async () => {
  109 |     await page.goto(`${BASE_URL}/product/21`);
  110 |   });
  111 | 
  112 |   await trackedStep('Verify product detail page loaded', async () => {
  113 |     const productHeading = page.locator('h1').filter({ hasText: 'Polo Shirt' });
  114 |     await expect(productHeading).toBeVisible();
  115 |   });
  116 | 
  117 |   await trackedStep('Click "Add to Cart" button', async () => {
  118 |     await page.locator('button.cyan-glow').filter({ hasText: 'Add to Cart' }).click();
  119 |   });
  120 | 
  121 |   await trackedStep('Wait for cart badge to update', async () => {
  122 |     await page.waitForTimeout(1500);
  123 |   });
  124 | 
  125 |   await trackedStep('Verify cart badge shows count "1"', async () => {
  126 |     await expect(page.getByRole('button', { name: '1' })).toBeVisible();
  127 |   });
  128 | 
  129 |   await trackedStep('Click cart badge to open cart page', async () => {
  130 |     await page.getByRole('button', { name: '1' }).click();
  131 |   });
  132 | 
  133 |   await trackedStep('Verify Shopping Cart page loaded', async () => {
  134 |     await expect(page).toHaveURL(/\/cart/);
  135 |     const cartHeading = page.locator('h1').filter({ hasText: 'Shopping Cart' });
  136 |     await expect(cartHeading).toBeVisible();
  137 |   });
  138 | 
  139 |   await trackedStep('Verify Polo Shirt appears in cart', async () => {
  140 |     const cartItem = page.locator('h3').filter({ hasText: 'Polo Shirt' });
  141 |     await expect(cartItem).toBeVisible();
  142 |   });
  143 | 
  144 |   await trackedStep('Verify "Proceed to Checkout" button is present', async () => {
  145 |     const checkoutBtn = page.locator('button').filter({ hasText: 'Proceed to Checkout' });
  146 |     await expect(checkoutBtn).toBeVisible();
  147 |   });
  148 | });
```
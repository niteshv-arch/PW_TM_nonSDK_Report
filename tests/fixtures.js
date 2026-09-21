// @ts-check
/**
 * HAR recording fixture.
 * Uses ESM-safe dynamic import to avoid Node 23 CJS/ESM resolution conflicts.
 */

let _test, _expect;

function getBase() {
  if (!_test) {
    const pw = require('@playwright/test');
    _test = pw.test;
    _expect = pw.expect;
  }
  return { test: _test, expect: _expect };
}

const path = require('path');
const fs = require('fs');

function createFixtures() {
  const { test: base, expect } = getBase();

  const test = base.extend({
    page: async ({ browser }, use, testInfo) => {
      const harDir = path.join(process.cwd(), 'logs', 'har');
      fs.mkdirSync(harDir, { recursive: true });

      const safeName = testInfo.title.replace(/[^a-z0-9]/gi, '_').slice(0, 60);
      const projectName = testInfo.project.name;
      const harPath = path.join(harDir, `${safeName}-${projectName}.har`);

      const context = await browser.newContext({
        recordHar: { path: harPath, mode: 'minimal', urlFilter: '**' },
      });

      const page = await context.newPage();
      await use(page);
      await context.close();
    },
  });

  return { test, expect };
}

module.exports = createFixtures();
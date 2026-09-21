// @ts-check
/**
 * HAR recording setup — imported via playwright.config.js require().
 * Adds beforeEach/afterEach hooks to all tests to record network HAR
 * to logs/har/<safeName>-<project>.har
 */
const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.beforeEach(async ({ context }, testInfo) => {
  const harDir = path.join(process.cwd(), 'logs', 'har');
  fs.mkdirSync(harDir, { recursive: true });

  const safeName = testInfo.title.replace(/[^a-z0-9]/gi, '_').slice(0, 60);
  const projectName = testInfo.project.name;
  const harPath = path.join(harDir, `${safeName}-${projectName}.har`);

  // Store harPath on context for afterEach
  context['_harPath'] = harPath;
  await context.routeFromHAR(harPath, { notFound: 'fallback', update: true });
});
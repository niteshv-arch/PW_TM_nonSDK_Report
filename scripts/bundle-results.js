#!/usr/bin/env node
// @ts-check
/**
 * Bundles the JUnit XML report + all attachment files (traces, HAR, screenshots)
 * into a single ZIP file ready for upload to BrowserStack TRA.
 *
 * ZIP structure:
 *   junit-report.xml
 *   logs/traces/*.zip
 *   logs/har/*.har
 *   logs/screenshots/*.png
 *
 * Usage: node scripts/bundle-results.js
 * Output: test-results/results-upload.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();
const outputZip = path.join(cwd, 'test-results', 'results-upload.zip');

// Remove old zip if exists
if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);

const filesToInclude = [];

// JUnit XML
const junitPath = path.join(cwd, 'test-results', 'junit-report.xml');
if (fs.existsSync(junitPath)) {
  filesToInclude.push({ src: junitPath, dest: 'junit-report.xml' });
}

// Traces
const tracesDir = path.join(cwd, 'logs', 'traces');
if (fs.existsSync(tracesDir)) {
  for (const f of fs.readdirSync(tracesDir)) {
    if (f.endsWith('.zip')) {
      filesToInclude.push({ src: path.join(tracesDir, f), dest: `logs/traces/${f}` });
    }
  }
}

// HAR files
const harDir = path.join(cwd, 'logs', 'har');
if (fs.existsSync(harDir)) {
  for (const f of fs.readdirSync(harDir)) {
    if (f.endsWith('.har')) {
      filesToInclude.push({ src: path.join(harDir, f), dest: `logs/har/${f}` });
    }
  }
}

// Screenshots
const screenshotsDir = path.join(cwd, 'logs', 'screenshots');
if (fs.existsSync(screenshotsDir)) {
  for (const f of fs.readdirSync(screenshotsDir)) {
    if (f.endsWith('.png') || f.endsWith('.jpg')) {
      filesToInclude.push({ src: path.join(screenshotsDir, f), dest: `logs/screenshots/${f}` });
    }
  }
}

if (filesToInclude.length === 0) {
  console.log('No files to bundle. Run tests first.');
  process.exit(0);
}

// Create a temp staging directory
const stagingDir = path.join(cwd, '.tmp-bundle');
fs.mkdirSync(stagingDir, { recursive: true });

for (const { src, dest } of filesToInclude) {
  const destPath = path.join(stagingDir, dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(src, destPath);
}

// Zip the staging directory
execSync(`cd "${stagingDir}" && zip -r "${outputZip}" .`, { stdio: 'inherit' });

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });

console.log(`\n✅ Results bundle created: test-results/results-upload.zip`);
console.log(`   Contains ${filesToInclude.length} files`);
console.log('\nUpload with:');
console.log(`  curl -X POST https://upload-automation.browserstack.com/upload \\`);
console.log(`    -H "Authorization: Bearer <JWT_TOKEN>" \\`);
console.log(`    -F "projectName=<your_project>" \\`);
console.log(`    -F "buildName=<your_build>" \\`);
console.log(`    -F "buildIdentifier=<your_build_id>" \\`);
console.log(`    -F "file=@test-results/results-upload.zip"`);
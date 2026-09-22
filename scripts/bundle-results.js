#!/usr/bin/env node
// @ts-check
/**
 * Bundles the JUnit XML report + all attachment files (traces, HAR, screenshots)
 * into a single ZIP file ready for upload to BrowserStack TRA.
 *
 * ZIP structure:
 *   junit-report.xml
 *   <test-folder>/trace.zip
 *   <test-folder>/network.har
 *   <test-folder>/test-failed-1.png
 *   <test-folder>/error-context.md
 *
 * Usage: node scripts/bundle-results.js
 * Output: test-results/results-upload.zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cwd = process.cwd();
const testResultsDir = path.join(cwd, 'test-results');
const outputZip = path.join(testResultsDir, 'results-upload.zip');

// Remove old zip if exists
if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);

const filesToInclude = [];

// JUnit XML
const junitPath = path.join(testResultsDir, 'junit-report.xml');
if (fs.existsSync(junitPath)) {
  filesToInclude.push({ src: junitPath, dest: 'junit-report.xml' });
}

// Walk test-results subfolders and collect attachments
const attachmentExts = ['.zip', '.har', '.png', '.jpg', '.md'];
if (fs.existsSync(testResultsDir)) {
  for (const entry of fs.readdirSync(testResultsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const folderName = entry.name;
    const folderPath = path.join(testResultsDir, folderName);
    for (const file of fs.readdirSync(folderPath)) {
      const ext = path.extname(file).toLowerCase();
      if (attachmentExts.includes(ext)) {
        filesToInclude.push({
          src: path.join(folderPath, file),
          dest: `${folderName}/${file}`,
        });
      }
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
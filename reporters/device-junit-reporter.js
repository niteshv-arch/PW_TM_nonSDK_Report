// @ts-check
/**
 * Custom JUnit reporter that:
 * 1. Appends [projectName] to each <testcase name> so runs across different
 *    device/browser configurations are NOT treated as re-runs of the same test.
 * 2. Adds <properties> per <testcase> with device, os, os_version, browser
 *    drawn from project.metadata (defined in playwright.config.js).
 */

const { Reporter } = require('@playwright/test/reporter');
const fs = require('fs');
const path = require('path');

class DeviceJUnitReporter {
  constructor(options = {}) {
    this._outputFile = options.outputFile || 'test-results/junit-report.xml';
    this._suites = [];
  }

  onBegin(config, suite) {
    this._config = config;
    this._rootSuite = suite;
  }

  onEnd(result) {
    const lines = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');

    const allTests = this._rootSuite.allTests();
    const totalTests = allTests.length;
    const totalFailures = allTests.filter(t => t.outcome() === 'failed').length;
    const totalSkipped = allTests.filter(t => t.outcome() === 'skipped').length;
    const totalTime = allTests.reduce((sum, t) => sum + (t.results[0]?.duration || 0), 0) / 1000;

    lines.push(`<testsuites name="Playwright Tests" tests="${totalTests}" failures="${totalFailures}" skipped="${totalSkipped}" time="${totalTime.toFixed(3)}">`);

    // Group tests by project
    const byProject = new Map();
    for (const test of allTests) {
      const projectName = test.parent?.project()?.name || 'default';
      if (!byProject.has(projectName)) byProject.set(projectName, []);
      byProject.get(projectName).push(test);
    }

    for (const [projectName, tests] of byProject) {
      const project = this._config.projects.find(p => p.name === projectName);
      const meta = project?.metadata || {};
      const suiteFailures = tests.filter(t => t.outcome() === 'failed').length;
      const suiteSkipped = tests.filter(t => t.outcome() === 'skipped').length;
      const suiteTime = tests.reduce((sum, t) => sum + (t.results[0]?.duration || 0), 0) / 1000;
      const timestamp = new Date().toISOString();

      lines.push(`  <testsuite name="${escapeXml(projectName)}" tests="${tests.length}" failures="${suiteFailures}" skipped="${suiteSkipped}" time="${suiteTime.toFixed(3)}" timestamp="${timestamp}">`);

      // Suite-level properties (device/os info)
      if (Object.keys(meta).length > 0) {
        lines.push('    <properties>');
        if (meta.device)     lines.push(`      <property name="device" value="${escapeXml(meta.device)}" />`);
        if (meta.os)         lines.push(`      <property name="os" value="${escapeXml(meta.os)}" />`);
        if (meta.os_version) lines.push(`      <property name="os_version" value="${escapeXml(meta.os_version)}" />`);
        lines.push('    </properties>');
      }

      for (const test of tests) {
        const result = test.results[0];
        const duration = ((result?.duration || 0) / 1000).toFixed(3);
        const outcome = test.outcome();
        // Append [projectName] to make the name unique per configuration
        const testName = escapeXml(`${test.title} [${projectName}]`);
        const className = escapeXml(test.parent?.title || projectName);
        const filePath = test.location?.file ? path.relative(process.cwd(), test.location.file) : '';
        const line = test.location?.line || 0;

        lines.push(`  <testcase name="${testName}" classname="${className}" time="${duration}" file="${escapeXml(filePath)}" line="${line}">`);

        // Per-testcase properties
        lines.push('    <properties>');
        if (meta.device)     lines.push(`      <property name="device" value="${escapeXml(meta.device)}" />`);
        if (meta.os)         lines.push(`      <property name="os" value="${escapeXml(meta.os)}" />`);
        if (meta.os_version) lines.push(`      <property name="os_version" value="${escapeXml(meta.os_version)}" />`);
        lines.push(`      <property name="browser" value="${escapeXml(projectName)}" />`);
        lines.push('    </properties>');

        if (outcome === 'skipped') {
          lines.push('    <skipped />');
        } else if (outcome === 'failed') {
          const msg = escapeXml(result?.error?.message || 'Test failed');
          lines.push(`    <failure message="${msg}" type="AssertionError">`);
          if (result?.error?.stack) lines.push(escapeXml(result.error.stack));
          lines.push('    </failure>');
        }

        // system-out: stdout (includes [[PROPERTY|...]] tags for TRA)
        const stdout = result?.stdout?.map(s => (typeof s === 'string' ? s : s.text)).join('') || '';
        if (stdout) {
          lines.push(`    <system-out><![CDATA[${stdout}]]></system-out>`);
        }

        lines.push('  </testcase>');
      }

      lines.push('  </testsuite>');
    }

    lines.push('</testsuites>');

    const dir = path.dirname(this._outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this._outputFile, lines.join('\n'), 'utf8');
    console.log(`\nJUnit report written to: ${this._outputFile}`);
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = DeviceJUnitReporter;
// @ts-check
/**
 * Custom Playwright reporter that:
 * 1. Saves HAR files into each test's output folder (same as trace.zip).
 * 2. Post-processes the JUnit XML to inject [[ATTACHMENT|...]] lines
 *    into each <system-out> CDATA block, referencing the per-test folder paths.
 * 3. Removes any <property name="attachment"> tags (uses system-out only).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class LogsReporter {
  constructor() {
    // Map of test.title+project → { outputDir, harPath, tracePath }
    this._testLogs = new Map();
  }

  onBegin() {}

  onTestEnd(test, result) {
    const projectName = test.parent?.project()?.name || 'default';

    // Find the test's output directory from the trace attachment path
    let outputDir = null;
    let tracePath = null;
    for (const attachment of result.attachments || []) {
      if (attachment.name === 'trace' && attachment.path) {
        outputDir = path.dirname(attachment.path);
        tracePath = attachment.path;
        break;
      }
    }

    if (!outputDir) return;

    // Extract HAR from trace and save to same folder as network.har
    const networkFile = path.join(outputDir, '0-trace.network');
    const harPath = path.join(outputDir, 'network.har');

    // Extract network file from trace.zip if not already present
    if (!fs.existsSync(networkFile) && tracePath) {
      try {
        execSync(`unzip -o "${tracePath}" "0-trace.network" -d "${outputDir}" > /dev/null 2>&1`);
      } catch (_) {}
    }

    if (fs.existsSync(networkFile)) {
      try {
        const lines = fs.readFileSync(networkFile, 'utf8').split('\n').filter(l => l.trim());
        const entries = [];
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'resource-snapshot' && event.snapshot?.request && event.snapshot?.response) {
              const snap = event.snapshot;
              entries.push({
                startedDateTime: snap.startedDateTime || new Date().toISOString(),
                time: snap.time || 0,
                request: {
                  method: snap.request.method,
                  url: snap.request.url || snap.url,
                  httpVersion: snap.request.httpVersion || 'HTTP/1.1',
                  headers: snap.request.headers || [],
                  queryString: [],
                  cookies: snap.request.cookies || [],
                  headersSize: snap.request.headersSize || -1,
                  bodySize: snap.request.bodySize || -1,
                },
                response: {
                  status: snap.response.status,
                  statusText: snap.response.statusText || '',
                  httpVersion: snap.response.httpVersion || 'HTTP/1.1',
                  headers: snap.response.headers || [],
                  cookies: snap.response.cookies || [],
                  content: snap.response.content || { size: -1, mimeType: 'text/plain' },
                  redirectURL: snap.response.redirectURL || '',
                  headersSize: snap.response.headersSize || -1,
                  bodySize: snap.response.bodySize || -1,
                },
                cache: {},
                timings: snap.timings || { send: 0, wait: snap.time || 0, receive: 0 },
              });
            }
          } catch (_) {}
        }
        const har = { log: { version: '1.2', creator: { name: 'Playwright', version: '1.61' }, pages: [], entries } };
        fs.writeFileSync(harPath, JSON.stringify(har, null, 2), 'utf8');
      } catch (_) {}
    }

    // Relative path from test-results/ root for use in JUnit XML
    const relDir = path.relative(path.join(process.cwd(), 'test-results'), outputDir);

    this._testLogs.set(`${test.title}::${projectName}`, {
      outputDir,
      relDir,
      harRelPath: `${relDir}/network.har`,
      traceRelPath: `${relDir}/trace.zip`,
    });
  }

  onEnd() {
    const junitPath = path.join(process.cwd(), 'test-results', 'junit-report.xml');
    if (!fs.existsSync(junitPath)) return;

    let xml = fs.readFileSync(junitPath, 'utf8');

    // Remove <property name="attachment"> tags
    xml = xml.replace(/\s*<property name="attachment"[^/]*\/>/g, '');

    // Inject [[ATTACHMENT|network.har]] into system-out for each test.
    // Match by the existing trace.zip path (already in system-out) which is unique per test+project.
    for (const [key, entry] of this._testLogs.entries()) {
      // The trace.zip path is already in system-out — use it as the anchor to find the right block
      const escapedTrace = entry.traceRelPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Find the system-out block that already contains this specific trace.zip reference
      const pattern = new RegExp(
        `(\\[\\[ATTACHMENT\\|${escapedTrace}\\]\\])(\\s*\\]\\]>\\s*</system-out>)`,
        'g'
      );
      xml = xml.replace(pattern, (match, traceRef, closing) => {
        // Only add network.har — skip if already present
        if (match.includes(entry.harRelPath)) return match;
        return `${traceRef}\n[[ATTACHMENT|${entry.harRelPath}]]${closing}`;
      });

    }

    fs.writeFileSync(junitPath, xml, 'utf8');
    console.log('\n📎 HAR files saved to test-results per-test folders. Attachment paths injected into JUnit XML.');
  }
}

module.exports = LogsReporter;
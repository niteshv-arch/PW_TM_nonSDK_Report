#!/usr/bin/env node
// @ts-check
/**
 * Post-run script: extracts network requests from Playwright trace.zip files
 * in logs/traces/ and writes HAR files to logs/har/.
 *
 * Usage: node scripts/extract-har-from-traces.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tracesDir = path.join(process.cwd(), 'logs', 'traces');
const harDir = path.join(process.cwd(), 'logs', 'har');
const tmpDir = path.join(process.cwd(), '.tmp-trace-extract');

fs.mkdirSync(harDir, { recursive: true });

if (!fs.existsSync(tracesDir)) {
  console.log('No traces directory found. Run tests first.');
  process.exit(0);
}

const traceFiles = fs.readdirSync(tracesDir).filter(f => f.endsWith('.zip'));

if (traceFiles.length === 0) {
  console.log('No trace files found in logs/traces/');
  process.exit(0);
}

for (const traceFile of traceFiles) {
  const tracePath = path.join(tracesDir, traceFile);
  const baseName = traceFile.replace('.zip', '');
  const harPath = path.join(harDir, `${baseName}.har`);
  const extractDir = path.join(tmpDir, baseName);

  try {
    fs.mkdirSync(extractDir, { recursive: true });
    execSync(`unzip -o "${tracePath}" -d "${extractDir}" > /dev/null 2>&1`);

    // Playwright stores network events in 0-trace.network (newline-delimited JSON)
    const networkFile = path.join(extractDir, '0-trace.network');
    if (!fs.existsSync(networkFile)) {
      console.warn(`⚠️  No network file in ${traceFile}`);
      continue;
    }

    const lines = fs.readFileSync(networkFile, 'utf8').split('\n').filter(l => l.trim());
    const entries = [];

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === 'resource-snapshot' && event.snapshot) {
          const snap = event.snapshot;
          if (snap.request && snap.response) {
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
                postData: snap.request.postData,
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
        }
      } catch (_) {}
    }

    const har = {
      log: {
        version: '1.2',
        creator: { name: 'Playwright', version: '1.61' },
        pages: [],
        entries,
      },
    };

    fs.writeFileSync(harPath, JSON.stringify(har, null, 2), 'utf8');
    console.log(`✅ HAR written: logs/har/${baseName}.har (${entries.length} requests)`);
  } catch (err) {
    console.warn(`⚠️  Could not process ${traceFile}: ${err instanceof Error ? err.message : err}`);
  }
}

// Cleanup tmp
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
console.log('\nDone. HAR files saved to logs/har/');
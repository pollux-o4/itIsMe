import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const cli = require.resolve('lighthouse/cli/index.js');
const target = process.argv[2] ?? 'http://localhost:4322/itIsMe/';
const output = resolve('output/qa/lighthouse');
mkdirSync(output, { recursive: true });
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = {};

// Run without competing builds/tests: simulated CPU throttling amplifies host load.
for (const device of ['mobile', 'desktop']) {
  const results = [];
  for (let run = 1; run <= 3; run++) {
    const report = `${output}/${device}-${run}.json`;
    execFileSync(process.execPath, [cli, target,
      '--chrome-flags=--headless --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json', `--output-path=${report}`, '--quiet',
      ...(device === 'desktop' ? ['--preset=desktop'] : []),
    ], { stdio: 'inherit' });
    const result = JSON.parse(readFileSync(report, 'utf8'));
    assert(!result.runtimeError, result.runtimeError?.message);
    results.push(result);
  }
  const scores = Object.fromEntries(Object.keys(results[0].categories).map(key => [key, median(results.map(result => result.categories[key].score)) * 100]));
  const metrics = Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'total-byte-weight'].map(key => [key, median(results.map(result => result.audits[key].numericValue))]));
  summary[device] = { scores, metrics };
  console.log(device, summary[device]);
}
writeFileSync(`${output}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`);
for (const [device, result] of Object.entries(summary)) {
  assert(result.scores.performance >= 95, `${device}: median performance must be >= 95`);
  for (const key of ['accessibility', 'best-practices', 'seo']) assert.equal(result.scores[key], 100, `${device}: ${key}`);
  assert(result.metrics['largest-contentful-paint'] <= 2500, `${device}: LCP > 2.5s`);
  assert(result.metrics['cumulative-layout-shift'] <= 0.05, `${device}: CLS > 0.05`);
  assert(result.metrics['total-blocking-time'] <= 200, `${device}: TBT > 200ms`);
  assert(result.metrics['total-byte-weight'] < 1024 * 1024, `${device}: initial transfer > 1 MiB`);
}

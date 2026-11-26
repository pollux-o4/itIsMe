import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

let links = 0;
for (const file of readdirSync('docs/architecture').filter(file => file.endsWith('.md'))) {
  const source = `docs/architecture/${file}`;
  for (const [, target] of readFileSync(source, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|#)/.test(target)) continue;
    assert(existsSync(resolve(dirname(source), target.split('#')[0])), `Broken architecture link: ${source} → ${target}`);
    links++;
  }
}
assert(links > 0, 'Architecture must link to implementation.');
console.log(`Architecture: ${links} local document/code links passed.`);

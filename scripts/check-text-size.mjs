import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

// Astro's CSS pipeline includes PostCSS; use the same parser as the build.
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve('astro'));
const postcss = astroRequire('postcss');
const staged = process.argv.includes('--staged');
const files = staged
  ? execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
  : walk('src');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(name) : [name];
  });
}

let errors = 0;
for (const file of files.filter(name => /\.(css|astro)$/.test(name))) {
  const content = staged ? execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' }) : readFileSync(file, 'utf8');
  const blocks = file.endsWith('.astro') ? [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => ({ css: m[1], line: content.slice(0, m.index).split('\n').length - 1 })) : [{ css: content, line: 0 }];
  for (const { css, line } of blocks) {
    const root = postcss.parse(css, { from: file });
    root.walkDecls(/^font(?:-size)?$/, declaration => {
      for (let parent = declaration.parent; parent; parent = parent.parent) {
        if (parent.type === 'atrule' && parent.name === 'media' && /\bprint\b/i.test(parent.params) && !/\bnot\s+print\b/i.test(parent.params)) return;
      }
      const sizes = [...declaration.value.matchAll(/(?<![\w.-])(\d+(?:\.\d+)?)(px|rem|pt)\b/gi)];
      for (const size of sizes) {
        const px = Number(size[1]) * ({ px: 1, rem: 16, pt: 4 / 3 })[size[2].toLowerCase()];
        if (px < 12) {
          console.error(`${file}:${line + declaration.source.start.line}: ${declaration.prop}: ${declaration.value} (최소 12px)`);
          errors++;
        }
      }
    });
  }
}
if (errors) process.exitCode = 1;
else console.log(`화면 글씨 크기 검사 통과${staged ? ' (스테이징된 변경)' : ''}`);

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const directory = 'src/styles/story';
const tiers = new Set([420, 599, 760, 761, 1099, 1100]);
let errors = 0;

function report(file, line, message) {
  console.error(`${file}:${line}: ${message}`);
  errors++;
}

function check(file, content) {
  // Tokenize once so comments, strings and nested/multiline functions stay distinct.
  const tokens = /\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\s+|[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?(?:[a-zA-Z]+|%)?|@?[a-zA-Z_\u0080-\uFFFF-][\w\u0080-\uFFFF-]*|[\s\S]/g;
  const stack = [];
  const exempt = path.basename(file) === 'tokens.css';
  let line = 1;
  let media = false;
  let fluid = 0;
  let identifier = '';

  for (const match of content.matchAll(tokens)) {
    const token = match[0];
    const startLine = line;
    for (const character of token) if (character === '\n') line++;
    if (/^\s|^\/\*/.test(token)) continue;
    if (token.startsWith('"') || token.startsWith("'")) {
      identifier = '';
      continue;
    }

    const lower = token.toLowerCase();
    if (lower === '@media') media = true;
    if (token === '(') {
      const isFluid = identifier === 'clamp' || identifier === 'min';
      stack.push({ fluid: isFluid, width: false, values: [] });
      if (isFluid) fluid++;
    } else if (token === ')') {
      const frame = stack.pop();
      if (frame?.fluid) fluid--;
      if (media && frame?.width) {
        for (const value of frame.values) {
          if (!/^([+-]?(?:\d*\.\d+|\d+\.?\d*))px$/i.test(value.token) || !tiers.has(Number.parseFloat(value.token))) {
            report(file, value.line, `허용되지 않은 화면 너비 ${value.token} (허용: ${[...tiers].join(', ')}px)`);
          }
        }
      }
    } else if (token === '{' || token === '}' || token === ';') {
      media = false;
    } else if (/^[+-]?(?:\d|\.\d)/.test(token)) {
      // 100vw/100svh are whole-screen bounds, not fluid scale, so they stay raw.
      if (!exempt && fluid && /(?:vw|svh)$/i.test(token) && !/^100(?:vw|svh)$/i.test(token)) {
        report(file, startLine, `clamp()/min()의 ${token}: var(--fit) 사용`);
      }
      if (media && stack.length) stack[stack.length - 1].values.push({ token, line: startLine });
    } else if (media && /^(?:min-|max-)?width$/.test(lower) && stack.length) {
      stack[stack.length - 1].width = true;
    }
    identifier = /^[-a-z_][\w-]*$/i.test(token) ? lower : '';
  }
}

for (const entry of readdirSync(directory, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.css')) continue;
  const file = path.join(directory, entry.name);
  check(file, readFileSync(file, 'utf8'));
}
if (errors) process.exitCode = 1;
else console.log('화면 너비·유동 크기 검사 통과');

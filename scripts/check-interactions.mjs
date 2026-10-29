import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';


// A minimal DOM: enough of EventTarget, attributes and selectors for the story modules.
class Element extends EventTarget {
  constructor(props = {}) {
    super();
    this.dataset = {}; this.attrs = new Map(); this.classes = new Set(); this.children = {}; this.hidden = false;
    this.style = { setProperty: (k, v) => this.attrs.set(k, v) };
    this.classList = { add: c => this.classes.add(c), remove: (...c) => c.forEach(x => this.classes.delete(x)), toggle: (c, on) => on ? this.classes.add(c) : this.classes.delete(c), contains: c => this.classes.has(c) };
    Object.assign(this, props);
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.get(k) ?? null; }
  removeAttribute(k) { this.attrs.delete(k); }
  querySelector(s) { return this.children[s] ?? null; }
  querySelectorAll(s) { return this.children[s] ?? []; }
  closest(s) { return this.closestMap?.[s] ?? null; }
}
const emit = (target, type, props = {}) => { const e = new Event(type); Object.assign(e, props); target.dispatchEvent(e); };
const flush = () => new Promise(r => setImmediate(r));

// Fixtures
const splitButtons = ['random', 'time'].map(mode => new Element({ dataset: { splitMode: mode } }));
const splitControls = new Element({ hidden: true });
const split = new Element({ dataset: { mode: 'time' } });
split.children = { '.split-controls': splitControls, '[data-split-mode]': splitButtons };


const panels = ['first-fixture', 'second-fixture'].map((id, i) => new Element({ dataset: { preview: id } }));
panels[0].attrs.set('data-active', '');
const rows = panels.map(panel => new Element({ dataset: { previewTarget: panel.dataset.preview } }));
for (const node of [...panels, ...rows]) {
  node.hasAttribute = k => node.attrs.has(k);
  node.toggleAttribute = (k, on) => on ? node.attrs.set(k, '') : node.attrs.delete(k);
}
const activePanel = () => panels.find(panel => panel.attrs.has('data-active'))?.dataset.preview;

const details = [{ open: false }, { open: true }];
const printButton = new Element();
const copyLabel = new Element({ textContent: '이메일 복사' }), copyStatus = new Element();
const copyButton = new Element({ dataset: { copyEmail: 'sample-user@example.test' }, hidden: true });
copyButton.children = { '[data-copy-label]': copyLabel };

const document = new EventTarget(), window = new EventTarget();
let printCalls = 0, copied = '', failCopy = false, frames = [];
window.print = () => printCalls++;
window.scrollY = 0; window.innerHeight = 800;
window.setTimeout = cb => { window.pendingTimeout = cb; return 1; };
document.fonts = { ready: Promise.resolve() };
document.images = [{ decode: () => Promise.reject(new Error('Unavailable image')) }, { loading: 'lazy', complete: false, decode: () => new Promise(() => {}) }];
document.documentElement = { scrollHeight: 4000 };
const selectors = {
  '.story-body': {}, '[data-split]': [split],
  '[data-preview]': panels, '[data-preview-target]': rows, '[data-disclosure]': details, '[data-print]': [printButton],
  '[data-copy-email]': copyButton, '[data-copy-status]': copyStatus,
};
document.querySelector = s => selectors[s] ?? null;
document.querySelectorAll = s => selectors[s] ?? [];
document.getElementById = () => null;
const media = {}; const matchMedia = q => (media[q] ??= Object.assign(new EventTarget(), { matches: !q.includes('reduced') }));
const sandbox = {
  document, window, matchMedia, AbortController, location: { hash: '' }, HTMLDetailsElement: Element, IntersectionObserver: undefined,
  navigator: { clipboard: { writeText: async value => { if (failCopy) throw new Error('denied'); copied = value; } } },
  requestAnimationFrame: cb => { frames.push(cb); return frames.length; }, cancelAnimationFrame: () => {}, clearTimeout: () => {},
  getComputedStyle: () => ({ top: '0px' }),
};
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  runInNewContext(`(function(exports, require, module) {${source}\n})`, sandbox)(module.exports, name => load(resolve(dirname(file), `${name}.ts`)), module);
  return module.exports;
}
load(resolve('src/scripts/story.ts'));
emit(document, 'astro:page-load'); emit(document, 'astro:page-load');

// Split demo starts from the doubtful split, and the static fallback is the final one.
assert.equal(splitControls.hidden, false);
assert.equal(split.dataset.mode, 'random');
assert.equal(splitButtons[0].getAttribute('aria-pressed'), 'true');
emit(splitButtons[1], 'click');
assert.equal(split.dataset.mode, 'time');
assert.equal(splitButtons[1].getAttribute('aria-pressed'), 'true');
assert.equal(splitButtons[0].getAttribute('aria-pressed'), 'false');

// Preview slot: the fixed panel follows pointer and keyboard; nothing floats over text.
assert.equal(activePanel(), 'first-fixture');
assert.equal(rows[0].attrs.has('data-previewing'), true);
emit(rows[1], 'pointerenter');
assert.equal(activePanel(), 'second-fixture');
assert.equal(rows[1].attrs.has('data-previewing'), true);
assert.equal(rows[0].attrs.has('data-previewing'), false);
emit(rows[0], 'focus');
assert.equal(activePanel(), 'first-fixture');
emit(rows[1], 'focus');

// Printing opens folded detail and restores it afterwards.
emit(window, 'beforeprint'); emit(window, 'beforeprint');
assert.deepEqual(details.map(d => d.open), [true, true]);
emit(window, 'afterprint');
assert.deepEqual(details.map(d => d.open), [false, true]);
emit(printButton, 'click');
assert.equal(printButton.disabled, true, 'Print action should indicate preparation.');
assert.equal(printButton.getAttribute('aria-busy'), 'true');
emit(printButton, 'click');
await flush();
assert.equal(printCalls, 1, 'A failed or never-loading lazy image must not block or duplicate printing.');
assert.equal(printButton.disabled, false);
assert.equal(printButton.getAttribute('aria-busy'), null);

// Contact copy confirms, resets and recovers from a denied clipboard.
assert.equal(copyButton.hidden, false);
emit(copyButton, 'click'); await flush();
assert.equal(copied, 'sample-user@example.test'); assert.equal(copyLabel.textContent, '복사 완료');
window.pendingTimeout(); assert.equal(copyLabel.textContent, '이메일 복사');
failCopy = true;
emit(copyButton, 'click'); await flush();
assert.equal(copyLabel.textContent, '다시 복사'); assert(copyStatus.textContent.includes('직접 선택'));

// Disposal restores the static page and detaches handlers.
emit(printButton, 'click');
emit(document, 'astro:before-swap');
await flush();
assert.equal(printCalls, 1, 'Disposed page must not open a pending print dialog.');
assert.equal(splitControls.hidden, true);
assert.equal(split.dataset.mode, 'time');
assert.equal(activePanel(), 'first-fixture', 'Disposal returns the slot to the static default');
emit(splitButtons[0], 'click');
assert.equal(split.dataset.mode, 'time', 'Disposed handlers cannot mutate the page');
console.log('Interactions: split demo, preview slot, printing, contact copy and cleanup passed.');

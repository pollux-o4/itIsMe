import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const module = { exports: {} };
const source = ts.transpileModule(readFileSync('src/scripts/story/shared/geometry.ts', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
runInNewContext(`(function(exports, require, module) {${source}\n})`, {})(module.exports, undefined, module);
const { fitRatio, invertTransform, clampView, zoomAround, panBy, toTransform } = module.exports;

// Compare fields in the host realm so VM object prototypes do not affect assertions.
const sizeIs = (actual, width, height) => assert.deepEqual({ ...actual }, { width, height });
const viewIs = (actual, scale, x, y) => assert.deepEqual({ ...actual }, { scale, x, y });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≈ ${expected}`);

sizeIs(fitRatio({ width: 300, height: 500 }, 2), 300, 150);
sizeIs(fitRatio({ width: 900, height: 200 }, 2), 400, 200);
sizeIs(fitRatio({ width: 900, height: 500 }, 2, 250), 250, 125);
sizeIs(fitRatio({ width: 100.6, height: 500 }, 3), 101, 34);

assert.equal(invertTransform(
  { left: 10, top: 80, width: 120, height: 90 },
  { left: 40, top: 20, width: 240, height: 30 },
), 'translate(-30px, 60px) scale(0.5, 3)');

const frame = { width: 400, height: 300 };
viewIs(clampView({ scale: 0.5, x: -20, y: 10 }, frame), 1, 0, 0);
viewIs(clampView({ scale: 2, x: 10, y: -500 }, frame), 2, 0, -300);
viewIs(clampView({ scale: 2, x: -500, y: 10 }, frame), 2, -400, 0);
viewIs(clampView({ scale: 2, x: -100, y: -80 }, frame), 2, -100, -80);

const initial = { scale: 2, x: -120, y: -90 };
const px = 137, py = 113;
for (const next of [1.5, 3]) {
  const zoomed = zoomAround(initial, next, px, py, frame, 4);
  assert.equal(zoomed.scale, next);
  near((px - zoomed.x) / zoomed.scale, (px - initial.x) / initial.scale);
  near((py - zoomed.y) / zoomed.scale, (py - initial.y) / initial.scale);
}
assert.equal(zoomAround(initial, 10, px, py, frame, 4).scale, 4);
viewIs(zoomAround(initial, 0.2, px, py, frame, 4), 1, 0, 0);
viewIs(zoomAround(initial, 1, px, py, frame, 4), 1, 0, 0);

viewIs(panBy(initial, 20, -30, frame), 2, -100, -120);
viewIs(panBy(initial, 1000, -1000, frame), 2, 0, -300);
viewIs(panBy(initial, -1000, 1000, frame), 2, -400, 0);
assert.equal(toTransform({ scale: 2.5, x: -12, y: 3 }), 'translate(-12px, 3px) scale(2.5)');

console.log('화면 좌표 계산 검사 통과');

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import config from "../astro.config.mjs";

// A small artifact self-check; run after building, including after CMS edits.
const base = config.base.replace(/\/$/, "");
const pages = readdirSync("dist", { recursive: true }).filter((path) =>
  path.endsWith(".html"),
);
assert(pages.length > 0, "No static pages were built.");
let references = 0;
// Stylesheets may ship as files or inlined into pages; both must resolve their assets.
const stylesheets = readdirSync("dist/_astro")
  .filter((file) => file.endsWith(".css"))
  .map((sheet) => readFileSync(join("dist/_astro", sheet), "utf8"));
for (const page of pages) {
  const html = readFileSync(join("dist", page), "utf8");
  assert(
    !/(?:data-variant|data-preview-defaults|id="preview-studio")/.test(html),
    `Prototype configuration shipped in ${page}`,
  );
  const links = [...html.matchAll(
    /<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g,
  )].map(match => match[1]);
  const responsive = [...html.matchAll(/\bsrcset="([^"]+)"/g)]
    .flatMap(match => match[1].split(',').map(candidate => candidate.trim().split(/\s+/)[0]));
  stylesheets.push(...[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]));
  const printSources = [...html.matchAll(/\bdata-print-src="([^"]+)"/g)].map(match => match[1]);
  for (const href of [...links, ...responsive, ...printSources]) {
    if (!href.startsWith("/")) continue;
    assert(
      href.startsWith(`${base}/`),
      `Missing GitHub Pages base in ${page}: ${href}`,
    );
    const path = decodeURIComponent(href.split(/[?#]/)[0].slice(base.length));
    const file = join("dist", path, path.endsWith("/") ? "index.html" : "");
    assert(existsSync(file), `Broken local reference in ${page}: ${href}`);
    references++;
  }
}
for (const css of stylesheets) {
  for (const [, href] of css.matchAll(/url\(["']?(\/[^)"']+)["']?\)/g)) {
    assert(href.startsWith(`${base}/`), `Missing base in CSS: ${href}`);
    assert(
      existsSync(join("dist", href.slice(base.length))),
      `Missing CSS asset: ${href}`,
    );
  }
}
console.log(
  `Verified ${pages.length} static pages and ${references} local references; single canonical layout; no prototype configuration.`,
);

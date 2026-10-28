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
for (const page of pages) {
  const html = readFileSync(join("dist", page), "utf8");
  assert(
    !/(?:data-variant|data-preview-defaults|id="preview-studio")/.test(html),
    `Prototype configuration shipped in ${page}`,
  );
  for (const match of html.matchAll(
    /<(?:a|img|script|link)\b[^>]*?\b(?:href|src)="([^"]+)"/g,
  )) {
    const href = match[1];
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
for (const sheet of readdirSync("dist/_astro").filter((file) =>
  file.endsWith(".css"),
)) {
  const css = readFileSync(join("dist/_astro", sheet), "utf8");
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

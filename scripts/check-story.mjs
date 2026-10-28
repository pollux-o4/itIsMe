import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { plainText } from '../src/lib/emphasis.ts';
const p = JSON.parse(readFileSync("src/data/portfolio.json", "utf8"));
const html = readFileSync("dist/index.html", "utf8");
const readable = html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, '');
const includesText = value => readable.includes(plainText(value).replace(/\s+/g, ''));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate page IDs");
for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
  assert(ids.includes(id), `Broken shortcut #${id}`);
for (const project of p.projects) {
  assert(html.includes(`data-preview="${project.id}"`), `Missing project preview: ${project.id}`);
  assert(
    html.includes(`id="${project.id}-evidence"`),
    `Missing inline evidence: ${project.id}`,
  );
  for (const key of ['role','summary','outcomeLabel','outcome','outcomeNote','cardTitle','cardRole','navigationLabel'])
    assert(includesText(project[key]), `Missing visible project brief: ${project.id}/${key}`);
  for (const detail of project.details)
    assert(includesText(detail.text), `Missing evidence: ${detail.heading}`);
  for (const f of project.figures)
    assert(existsSync(`public/images/portfolio/${f.image}.webp`));
}
assert.equal((html.match(/data-preview-default(?:[\s=>])/g) || []).length, 1, 'Exactly one default preview in HTML');
const defaultProject = p.projects.find(project => project.preview.isDefault);
const defaultPanel = [...html.matchAll(/<a\b[^>]*data-preview="([^"]+)"[^>]*>/g)].find(match => match[0].includes('data-preview-default'));
assert.equal(defaultPanel?.[1], defaultProject.id, 'Default preview must follow content data');
for (const project of p.projects) {
  for (const resource of project.resources) assert(html.includes(resource.href), `Missing resource: ${resource.label}`);
}
for (const other of p.otherProjects) {
  assert(existsSync(`public/images/portfolio/${other.image}.webp`), `Missing preview: ${other.id}`);
  assert(html.includes(other.imageAlt), `Missing preview description: ${other.id}`);
  assert(
    includesText(other.description),
    `Missing other project: ${other.id}`,
  );
}
for (const experience of p.experience) {
  assert(
    includesText(experience.summary),
    `Missing work summary: ${experience.organization}`,
  );
  assert(
    includesText(experience.details),
    `Missing work evidence: ${experience.organization}`,
  );
}
assert(html.includes(p.recordNote), "Missing conflicting-source note");
const structured = JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
);
assert.equal(structured.mainEntity.name, p.name);
assert.equal(structured.mainEntity.jobTitle, p.role);
assert.equal(
  (html.match(/<details[^>]*data-disclosure/g) || []).length,
  p.projects.length + p.otherProjects.length + 1,
);
assert(!html.includes("예시 프로젝트"), "Sample work leaked into portfolio");
let depth = 0;
for (const token of html.matchAll(/<\/?details\b[^>]*>/g)) {
  depth += token[0].startsWith("</") ? -1 : 1;
  assert(depth <= 1, "Progressive disclosure must not nest");
}
assert.equal(depth, 0);
console.log(
  "Story coverage: every chapter, evidence paragraph, figure and shortcut is present.",
);

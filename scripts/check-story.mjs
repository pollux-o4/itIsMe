import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
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
  assert(html.includes(`href="#${project.id}"`), `Missing index link: ${project.id}`);
  assert(html.includes(`data-preview="${project.id}"`), `Missing preview slot panel: ${project.id}`);
  assert(existsSync(`public/images/portfolio/${project.cover}.webp`), `Missing cover: ${project.id}`);
  assert(
    html.includes(`id="${project.id}-evidence"`),
    `Missing inline evidence: ${project.id}`,
  );
  for (const key of ['role','summary','outcomeLabel','outcome','outcomeNote','cardTitle','cardRole','navigationLabel'])
    assert(includesText(project[key]), `Missing visible project brief: ${project.id}/${key}`);
  for (const value of [project.question.label, project.question.evidence, ...Object.values(project.narrative)])
    assert(includesText(value), `Missing case narrative: ${project.id}`);
  for (const item of [...project.contribution.mine, ...project.contribution.team])
    assert(includesText(item), `Missing contribution: ${project.id}/${item}`);
  assert(project.evidence.length >= 2, `A case needs at least two claim-picture pairs: ${project.id}`);
  for (const item of project.evidence) {
    assert(includesText(item.claim) && includesText(item.why), `Missing evidence claim: ${project.id}`);
    if (!item.figure) continue;
    assert(existsSync(`public/images/portfolio/${item.figure.image}.webp`), `Missing evidence image: ${item.figure.image}`);
    assert(includesText(item.figure.caption), `Missing evidence caption: ${item.figure.image}`);
    for (const mark of item.figure.marks) assert(includesText(mark.label), `Missing mark label: ${item.figure.image}`);
  }
  for (const detail of project.details)
    assert(includesText(detail.text), `Missing evidence: ${detail.heading}`);
}
for (const entry of p.timeline) for (const item of entry.items) assert(includesText(item.text), `Missing timeline item: ${entry.date}`);
for (const year of p.timelineYears) assert(includesText(year.note), `Missing year note: ${year.year}`);
for (const value of [p.motto, ...Object.values(p.about)]) assert(includesText(value), 'Missing self-introduction in own words');
assert.equal((html.match(/data-preview="[^"]+"[^>]*data-active/g) || []).length, 1, 'Exactly one default preview panel');
assert(html.indexOf('class="hero-portrait"') < html.indexOf('class="hero-words"'), 'Portrait must precede the words it looks at (SPEC 2.1)');
for (const project of p.projects) {
  const section = html.slice(html.indexOf(`id="${project.id}"`));
  assert(section.indexOf('class="case-brief"') < section.indexOf('class="evidence-list"'), `Brief must precede the evidence: ${project.id} (SPEC 2.8)`);
  assert(section.indexOf(`href="${project.link}"`) < section.indexOf('class="case-brief"'), `Deck link belongs in the case head: ${project.id} (SPEC 2.3)`);
}
for (const item of p.highlights) assert(includesText(item.label), `Missing highlight: ${item.label}`);
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
// Copy speaks plainly; disclaimers belong in an interview, not on the page (SPEC 3.6).
for (const phrase of ['미확인', '미기재', '확인하지 못', '직접 비교하지', '임의로 그렸', '설명용 예시', '검증하지 않았', '기록에 없'])
  assert(!readable.includes(phrase.replace(/\s+/g, '')), `Hedging phrase on the page: ${phrase}`);
let depth = 0;
for (const token of html.matchAll(/<\/?details\b[^>]*>/g)) {
  depth += token[0].startsWith("</") ? -1 : 1;
  assert(depth <= 1, "Progressive disclosure must not nest");
}
assert.equal(depth, 0);
// The headline highlight span is `.mark`; a page-wide `.mark` rule once pulled it out of the flow.
for (const sheet of readdirSync("dist/_astro").filter((file) => file.endsWith(".css")))
  assert(!/(^|\})\.mark\{/.test(readFileSync(`dist/_astro/${sheet}`, "utf8")), `Bare .mark rule in ${sheet} collides with the headline highlight`);
console.log(
  "Story coverage: every chapter, evidence paragraph, figure and shortcut is present.",
);

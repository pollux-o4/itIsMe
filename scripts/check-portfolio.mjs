import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portfolioSchema } from '../src/lib/portfolio-schema.ts';

const data = JSON.parse(readFileSync('src/data/portfolio.json', 'utf8'));
assert(portfolioSchema.safeParse(data).success);
const cms = structuredClone(data);
cms.projects[0].preview.title = '';
cms.projects[0].preview.caption = null;
delete cms.projects[0].resources;
assert(portfolioSchema.safeParse(cms).success, 'Empty CMS overrides must use their defaults.');
function rejects(change) {
  const edited = structuredClone(data);
  change(edited);
  assert.equal(portfolioSchema.safeParse(edited).success, false);
}
rejects(p => p.projects[0].id = p.otherProjects[0].id);
rejects(p => p.projects[0].id = 'archive');
rejects(p => p.projects.forEach(project => project.preview.isDefault = false));
rejects(p => p.projects.forEach(project => project.preview.isDefault = true));
rejects(p => p.projects[0].preview.figure = 999);
rejects(p => p.projects[0].resources.push({label:'Unsafe link', href:'javascript:alert(1)'}));
console.log('Portfolio contract: unique chapter IDs, one default preview, evidence references and HTTPS resources passed.');

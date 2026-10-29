import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portfolioSchema } from '../src/lib/portfolio-schema.ts';

const data = JSON.parse(readFileSync('src/data/portfolio.json', 'utf8'));
assert(portfolioSchema.safeParse(data).success);
const cms = structuredClone(data);
delete cms.projects[0].resources;
assert(portfolioSchema.safeParse(cms).success, 'Missing CMS resources must use their default.');
function rejects(change) {
  const edited = structuredClone(data);
  change(edited);
  assert.equal(portfolioSchema.safeParse(edited).success, false);
}
rejects(p => p.projects[0].id = p.otherProjects[0].id);
rejects(p => p.projects[0].id = 'archive');
rejects(p => p.projects[0].id = 'work');
rejects(p => delete p.projects[0].narrative.limits);
rejects(p => p.projects[0].contribution.mine = []);
rejects(p => p.projects[0].cover = '../portrait');
rejects(p => p.timeline[0].items = []);
rejects(p => p.timeline[0].items[0].kind = 'misc');
rejects(p => p.timeline.push({ date: '2027.01', items: [{ text: '새 항목', kind: 'project' }] }));
rejects(p => delete p.about.motivation);
rejects(p => p.projects[0].evidence = p.projects[0].evidence.slice(0, 1));
rejects(p => { const item = p.projects[0].evidence.find(e => e.figure) ?? p.projects[0].evidence[0]; item.visual = 'split'; item.figure = { image: 'x', width: 1, height: 1, alt: 'a', caption: 'c', marks: [] }; });
rejects(p => { const item = p.projects.flatMap(x => x.evidence).find(e => e.figure); item.figure.marks = [{ x: 0.9, y: 0, w: 0.5, h: 0.1, label: 'out of frame' }]; });
rejects(p => p.projects[0].resources.push({label:'Unsafe link', href:'javascript:alert(1)'}));
console.log('Portfolio contract: unique chapter IDs, complete case narrative, stated contribution, safe image names and HTTPS resources passed.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { resolve, dirname } from 'node:path';
class Element extends EventTarget {
  constructor(id) { super(); this.id=id; this.dataset={preview:id}; this.hash=`#${id}`; this.attrs=new Map(); this.style={setProperty:(k,v)=>this.attrs.set(k,v)}; }
  hasAttribute(k) { return this.attrs.has(k); }
  toggleAttribute(k,on) { on?this.attrs.set(k,''):this.attrs.delete(k); }
  setAttribute(k,v) { this.attrs.set(k,v); }
  removeAttribute(k) { this.attrs.delete(k); if(k==='style')this.attrs.delete('--preview-x'); }
  matches() { return true; }
  getBoundingClientRect() { return {left:0,width:100}; }
}
const panels=['field-fixture','engine-fixture','service-fixture'].map(id=>new Element(id));
const cards=panels.map(p=>new Element(p.id)), preview=new Element('preview');
panels[2].toggleAttribute('data-active',true);
panels[2].toggleAttribute('data-preview-default',true);
const document=new EventTarget(), window=new EventTarget();
const printButton = new Element("print");
let printCalls = 0;
window.print = () => printCalls++;
document.fonts = {ready: Promise.resolve()};
document.images = [{decode: () => Promise.reject(new Error("Unavailable image"))}];
const media=new EventTarget(), reduced=new EventTarget(); media.matches=true; reduced.matches=false;
const detail={open:false};
document.querySelector=s=>s==='.story-body'?{}:s==='.project-preview'?preview:s==='[data-preview][data-active]'?panels.find(p=>p.attrs.has('data-active')):null;
document.querySelectorAll=s=>s==='[data-preview]'?panels:s==='.story-map .map-card'?cards:s==='[data-disclosure]'?[detail]:s==='[data-print]'?[printButton]:[];
const sandbox={document,window,AbortController,matchMedia:q=>q.includes('reduced-motion')?reduced:media,location:{hash:''},HTMLDetailsElement:Element,requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}};
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = {exports:{}};
  modules.set(file, module);
  const source = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const run = runInNewContext(`(function(exports, require, module) {${source}\n})`, sandbox);
  run(module.exports, name => load(resolve(dirname(file), `${name}.ts`)), module);
  return module.exports;
}
load(resolve('src/scripts/story.ts'));
document.getElementById=()=>null;
const emit=(target,type,props={})=>{const e=new Event(type);Object.assign(e,props);target.dispatchEvent(e);};
const selected=()=>panels.find(p=>p.attrs.has('data-active'))?.id;
emit(document,'astro:page-load');emit(document,'astro:page-load');
emit(cards[0],'pointerenter',{pointerType:'mouse'});assert.equal(selected(),'field-fixture');
assert.equal(panels[1].inert,true);assert.equal(panels[0].attrs.get('aria-hidden'),'false');
emit(cards[0],'pointermove',{pointerType:'mouse',clientX:100});assert.equal(preview.attrs.get('--preview-x'),'6px');
emit(cards[0],'pointerleave'); reduced.matches=true;
emit(cards[0],'pointermove',{pointerType:'mouse',clientX:100});assert.equal(preview.attrs.has('--preview-x'),false);
emit(cards[1],'focusin');assert.equal(selected(),'engine-fixture');
emit(window,'beforeprint');emit(window,'beforeprint');assert.equal(selected(),'service-fixture');assert.equal(detail.open,true);
emit(window,'afterprint');assert.equal(selected(),'engine-fixture');assert.equal(detail.open,false);
emit(document,'keydown',{key:'Escape'});assert.equal(selected(),'service-fixture');
media.matches=false;emit(media,'change');emit(cards[0],'pointerenter',{pointerType:'touch'});emit(cards[0],'focusin');assert.equal(selected(),'service-fixture');
emit(printButton,'click');
await new Promise(resolve => setImmediate(resolve));
assert.equal(printCalls, 1, 'Image decoding failure must not prevent printing.');
emit(printButton,'click');
emit(document,'astro:before-swap');
await new Promise(resolve => setImmediate(resolve));
assert.equal(printCalls, 1, 'Disposed page must not open a pending print dialog.');
media.matches=true;emit(cards[1],'focusin');assert.equal(selected(),'service-fixture');
console.log('Preview: pointer, keyboard, reduced motion, touch, print restoration and cleanup passed.');

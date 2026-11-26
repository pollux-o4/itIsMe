import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function check(path) {
  for (const entry of readdirSync(path,{withFileTypes:true})) {
    const file=join(path,entry.name);
    if(entry.isDirectory()) check(file);
    else {
      assert(!/\.pdf$/i.test(file), `Unexpected public PDF: ${file}`);
      if(/\.(html|json|js|css|txt|xml)$/i.test(file)) {
        const content=readFileSync(file,'utf8');
        if(/\.html$/i.test(file)) assert(!/href\s*=\s*["']tel:/i.test(content), `Unexpected telephone link: ${file}`);
        assert(!/\b01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}\b/.test(content), `Unexpected phone number: ${file}`);
      }
    }
  }
}
check('dist');
console.log('Public build has no PDF, telephone link or Korean mobile number.');

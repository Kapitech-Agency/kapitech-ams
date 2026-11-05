import {readdirSync,readFileSync,existsSync,statSync} from 'node:fs';
import {join,resolve,dirname,extname,relative,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..'), files=[], issues=[]; let links=0;
function walk(p){for(const e of readdirSync(p,{withFileTypes:true})){if(['node_modules','.git','dist','coverage'].includes(e.name))continue;const x=join(p,e.name);if(e.isDirectory())walk(x);else if(e.isFile())files.push(x)}}
walk(root);
const mds=files.filter(p=>extname(p).toLowerCase()==='.md');
const anchors=new Map();
function slug(s){return s.toLowerCase().replace(/<[^>]*>/g,'').replace(/[\x60*_~]/g,'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().replace(/\s/g,'-')}
function headings(file){if(anchors.has(file))return anchors.get(file);const set=new Set(), counts=new Map(),txt=readFileSync(file,'utf8');for(const m of txt.matchAll(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/gm)){const key=slug(m[1]);if(!key)continue;const n=counts.get(key)||0;set.add(n?key+'-'+n:key);counts.set(key,n+1)}for(const m of txt.matchAll(/<a\s+[^>]*(?:id|name)=["']([^"']+)["']/gi))set.add(m[1]);anchors.set(file,set);return set}
for(const file of mds){let text=readFileSync(file,'utf8').replace(/^ {0,3}(?:\x60{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}(?:\x60{3,}|~{3,})[^\n]*$/gm,'').replace(/\x60[^\x60\n]+\x60/g,'');for(const [i,line] of text.split('\n').entries()){for(const m of line.matchAll(/!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g)){let target=m[1].replace(/^<|>$/g,'');if(!target||/^(?:https?:|mailto:|tel:|data:)/i.test(target))continue;const [path,fragment]=target.split('#',2);if(path.startsWith('/'))continue;const dest=path?resolve(dirname(file),decodeURIComponent(path.split('?')[0])):file;links++;let problem='';if(!(dest===root||dest.startsWith(root+sep)))problem='Path escapes repository';else if(!existsSync(dest))problem='Missing path';else if(fragment&&extname(dest).toLowerCase()==='.md'&&!headings(dest).has(decodeURIComponent(fragment)))problem='Missing heading anchor';if(problem)issues.push({file:relative(root,file),line:i+1,target,problem})}}}
// Scan literal documentation path references across all tracked source/config text files.
// This does not attempt to resolve dynamically constructed filenames.
let codeFilesChecked=0,docPathReferences=0;
for(const file of files) {
  if(!/\.(?:ts|tsx|js|jsx|mjs|cjs|css|sql|json|yml|yaml|html)$/.test(file)) continue;
  codeFilesChecked++;
  const text=readFileSync(file,'utf8');
  for(const match of text.matchAll(/\bdocs\/[A-Za-z0-9_./-]+\.md\b/g)) {
    docPathReferences++;
    const dest=resolve(root,match[0]);
    if(!dest.startsWith(root+sep)||!existsSync(dest)) {
      issues.push({file:relative(root,file),target:match[0],problem:'Missing literal docs path in source/config'});
    }
  }
}
console.log(JSON.stringify({markdownFiles:mds.length,checkedLinks:links,codeFilesChecked,docPathReferences,issues:issues.slice(0,100),issueCount:issues.length},null,2));
if(issues.length)process.exitCode=1;

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=buildSync({stdin:{contents:`export * from './src/components/admin/finance/FinanceRecordSurface';export * from './src/pages/admin/AdminFinanceWorkspace';export * from './src/components/admin/AdminFilterToolbar';export {AdminMetricCard} from './src/components/admin/AdminModulePrimitives';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'lucide-react':path.join(root,'src/lib/untitled-ui-icon-bridge.tsx')},loader:{'.css':'empty'}});
const compiled={exports:{} as any};const require=createRequire(import.meta.url);
new Function('require','module','exports',bundle.outputFiles[0].text)(require,compiled,compiled.exports);
const {FinanceRecordSurface,FinanceDataTable,AdminFilterToolbar,AdminMetricCard}=compiled.exports;
const {MemoryRouter}=require('react-router-dom');
const e=React.createElement;
const render=(component:any,props:any)=>renderToStaticMarkup(e(MemoryRouter,null,e(component,props)));
const table=(headers:string[],cells:React.ReactNode[],rowProps={})=>e('table',null,e('thead',null,e('tr',null,...headers.map(h=>e('th',{key:h},h)))),e('tbody',null,e('tr',rowProps,...cells.map((c,i)=>e('td',{key:i},c)))));

test('Finance mobile records preserve original source cells, conditional columns and callbacks',()=>{
 const inspect=()=>{};const action=e('button',{onClick:inspect},'Inspect canonical invoice');
 const original=table(['Invoice','Currency','Balance','Actions'],['QA-INV','USD','—',action]);
 const html=render(FinanceRecordSurface,{caption:'Client billing',children:original});
 assert.match(html,/aria-label="Client billing cards"/);
 assert.match(html,/<dt[^>]*>Currency<\/dt>/);
 assert.match(html,/<dd[^>]*>USD<\/dd>/);
 assert.match(html,/<dd[^>]*>—<\/dd>/);
 assert.match(html,/<caption class="sr-only">Client billing<\/caption>/);
 assert.match(html,/tabindex="0" aria-label="Scrollable Client billing table"/);
 const tree=FinanceRecordSurface({caption:'Client billing',children:original});
 const callbacks:any[]=[];function walk(node:any){if(!React.isValidElement(node))return;const props=node.props as any;if(props.onClick)callbacks.push(props.onClick);React.Children.forEach(props.children,walk);}walk(tree);
 assert.ok(callbacks.includes(inspect),'The mobile action must retain the canonical source handler.');
 const conditional=table(['Actions'],[action]);
 const single=render(FinanceRecordSurface,{caption:'Only visible column',children:conditional});
 assert.equal((single.match(/Inspect canonical invoice/g)||[]).length,2,'One action per mobile and desktop representation; no duplicate mobile identity action.');
});

test('Finance formal reports and unsupported spans retain the original keyboard-scrollable table',()=>{
 const native=table(['Account','Amount'],['Revenue','IDR 100']);
 const report=render(FinanceRecordSurface,{caption:'Financial statement',mobileCards:false,children:native});
 assert.doesNotMatch(report,/role="list"/);
 assert.match(report,/Scrollable Financial statement table/);
 const span=e('table',null,e('thead',null,e('tr',null,e('th',null,'Account'),e('th',null,'Amount'))),e('tbody',null,e('tr',null,e('td',{colSpan:2},'Source unavailable'))));
 const fallback=render(FinanceRecordSurface,{caption:'Source statement',children:span});
 assert.doesNotMatch(fallback,/role="list"/);
 assert.match(fallback,/colSpan="2"|colspan="2"/);
 assert.match(fallback,/Source unavailable/);
});

test('Finance shared register renders one inset empty state outside tables and keeps pagination bounded',()=>{
 const props={title:'Project allocations',columns:[{label:'Project'},{label:'Amount'}],rows:[],emptyMessage:'Allocation source unavailable; retry to confirm records.'};
 const empty=render(FinanceDataTable,props);
 assert.equal((empty.match(/data-ams-empty-inset/g)||[]).length,1);
 assert.doesNotMatch(empty,/<table|<td|role="list"/);
 assert.match(empty,/Allocation source unavailable/);
 const loaded=render(FinanceDataTable,{...props,rows:Array.from({length:12},(_,i)=>({id:'qa-'+i,cells:['Project '+i,'IDR '+i]}))});
 assert.match(loaded,/Showing/);assert.match(loaded.replace(/<[^>]+>/g,''),/of 12 records/);
 assert.doesNotMatch(loaded,/Project 10<\/|Project 11<\//);
 assert.match(loaded,/Next page/);
});

test('Search-only shared toolbar omits an inert filter disclosure while filtered consumers keep it',()=>{
 const props={searchValue:'',onSearchChange:()=>{},searchLabel:'Search Finance records',activeFilterCount:0,onReset:()=>{}};
 const search=render(AdminFilterToolbar,props);
 assert.doesNotMatch(search,/>Filters<|Filter options/);
 assert.match(search,/aria-label="Search Finance records"/);
 const filtered=render(AdminFilterToolbar,{...props,activeFilterCount:2,children:e('span',null,'Status field')});
 assert.match(filtered,/aria-expanded="false"/);
 assert.match(filtered,/2 filters applied/);
 assert.doesNotMatch(filtered,/Status field|Filter options/);
});

test('Financial metric values can stack above trends without changing the approved default',()=>{
 const props={label:'Collected revenue',value:'IDR 100,000,000,000',sparkline:[10,20,15]};
 const inline=render(AdminMetricCard,props);const stacked=render(AdminMetricCard,{...props,valueLayout:'stacked'});
 assert.match(inline,/truncate text-2xl|text-2xl[^>]+truncate/);
 assert.match(stacked,/flex-col items-start/);
 assert.match(stacked,/max-w-full break-words/);
 assert.match(stacked,/IDR 100,000,000,000/);
});

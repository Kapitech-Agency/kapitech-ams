import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = buildSync({ stdin: { contents: "export {AdminFilterToolbar,AdminFilterField} from './src/components/admin/AdminFilterToolbar'; export {AdminModuleHeader} from './src/components/admin/AdminModulePrimitives';", resolveDir: root }, bundle:true, write:false, platform:'node', format:'cjs', packages:'external', alias:{'lucide-react':path.join(root,'src/lib/untitled-ui-icon-bridge.tsx')}, loader:{'.css':'empty'} });
const compiled = { exports: {} as any };
new Function('require','module','exports',bundle.outputFiles[0].text)(createRequire(import.meta.url),compiled,compiled.exports);
const {AdminFilterToolbar, AdminFilterField, AdminModuleHeader} = compiled.exports;
const noop = () => {};
const toolbar = (props = {}) => React.createElement(AdminFilterToolbar, {searchValue:'',onSearchChange:noop,searchLabel:'Search delivery',activeFilterCount:0,onReset:noop,...props}, React.createElement(AdminFilterField,{label:'Owner'},React.createElement('select',{'aria-label':'Filter by owner'},React.createElement('option',null,'All owners'))));

test('Shared filters start collapsed with search and accessible disclosure, without hidden focusable fields', () => {
  const html = renderToStaticMarkup(toolbar());
  assert.match(html,/aria-label="Search delivery"/);
  assert.match(html,/aria-expanded="false"/);
  assert.match(html,/aria-controls="ams-filters-/);
  assert.doesNotMatch(html,/Filter by owner|Filter options|Reset filters|filters applied/);
});

test('Collapsed active filters remain visible and clearable without losing search', () => {
  const html = renderToStaticMarkup(toolbar({searchValue:'Launch brief',activeFilterCount:2}));
  assert.match(html,/value="Launch brief"/);
  assert.match(html,/2 filters applied/);
  assert.match(html,/Clear filters/);
  assert.match(html,/Clear search delivery/);
  assert.match(html,/aria-expanded="false"/);
  assert.doesNotMatch(html,/Filter by owner/);
});

test('Multiple shared toolbars receive independent panel IDs', () => {
  const html = renderToStaticMarkup(React.createElement(React.Fragment,null,toolbar(),toolbar()));
  const ids = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,2);
  assert.equal(new Set(ids).size,2);
});

test('Shared workspace header keeps context, one h1, description and actions in consistent regions', () => {
  const html = renderToStaticMarkup(React.createElement(AdminModuleHeader,{variant:'workspace',title:'Tasks & Execution',eyebrow:'Projects / Tasks',description:'Creative and technology delivery.',actions:React.createElement('button',null,'New task')}));
  assert.match(html,/ams-module-header--workspace/);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.indexOf('Projects / Tasks') < html.indexOf('<h1'));
  assert.ok(html.indexOf('</h1>') < html.indexOf('Creative and technology delivery.'));
  assert.ok(html.indexOf('Creative and technology delivery.') < html.indexOf('<button'));
  const defaultHeader = renderToStaticMarkup(React.createElement(AdminModuleHeader,{title:'Clients'}));
  assert.match(defaultHeader,/ams-module-header--workspace/,'All module headers use the approved default, including existing callers.');
});

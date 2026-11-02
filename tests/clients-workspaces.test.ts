import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=buildSync({stdin:{contents:`export * from './src/components/admin/clients/ClientWorkspace';export * from './src/components/admin/clients/ClientDirectoryRegister';export * from './src/pages/admin/AdminClientSlaMonitoring';`,resolveDir:root,loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'lucide-react':path.join(root,'src/lib/untitled-ui-icon-bridge.tsx')},loader:{'.css':'empty'}});
const compiled={exports:{} as any};const require=createRequire(import.meta.url);
new Function('require','module','exports',bundle.outputFiles[0].text)(require,compiled,compiled.exports);
const {ClientDirectoryRegister,ClientSourceWorkspace,ClientAgreementTabs,CLIENT_AGREEMENT_TABS,CLIENT_ONBOARDING_TABS,CLIENT_SERVICE_TABS,AdminClientSlaMonitoring}=compiled.exports;
const {MemoryRouter}=require('react-router-dom');
const render=(component:any,props:Record<string,unknown>,url='/admin/clients/all-clients')=>renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[url]},React.createElement(component,props)));
const noop=()=>{};
const account={id:'qa-canonical-id',slug:'different-readable-slug',company:'QA creative & technology',name:'QA contact',email:'qa@example.invalid',phone:'',status:'lead',industry:'Creative services',location:'Jakarta',contactPersonRole:'Stakeholder',projectsCount:9,createdAt:'2026-01-01',updatedAt:'2026-11-01'};
const props={records:[account],loading:false,unavailable:false,hasAccounts:true,contacts:false,onboarding:false,canManage:false,sortKey:'company',direction:'asc',onSort:noop,onInspect:noop,onEdit:noop,onReset:noop,onRetry:noop,formatDate:(s:string)=>s,serviceContext:()=> 'Service not recorded',spendContext:()=> 'Spend cap not configured',pagination:React.createElement('p',null,'Canonical pagination')};

test('Client register keeps aligned semantic columns and source identity without inferred account tiers',()=>{
  const html=render(ClientDirectoryRegister,props);
  const table=html.slice(html.indexOf('<table'),html.indexOf('</table>'));
  assert.equal((table.match(/<th scope="col"/g)||[]).length,7);
  const row=table.slice(table.indexOf('<tbody'));
  assert.equal((row.match(/<td /g)||[]).length,6);
  assert.match(row,/<th scope="row"/);
  assert.match(html,/aria-sort="ascending"/);
  assert.match(html,/Service not recorded/);
  assert.match(html,/Spend cap not configured/);
  assert.match(html,/mailto:qa@example.invalid/);
  assert.match(html,/Phone not recorded/);
  assert.doesNotMatch(html,/Tier 1|Retainer Core|relationship owner/i);
  assert.match(html,/tabindex="0" role="region" aria-label="Scrollable company directory"/);
});

test('Directory inspection remains available without management actions',()=>{
  const readonly=render(ClientDirectoryRegister,props);
  assert.match(readonly,/Client 360/);
  assert.doesNotMatch(readonly,/aria-label="Manage /);
  assert.match(render(ClientDirectoryRegister,{...props,canManage:true}),/aria-label="Manage QA creative/);
});

test('Contacts is a primary-contact view of the same company identity',()=>{
  const html=render(ClientDirectoryRegister,{...props,contacts:true});
  assert.match(html,/Primary contacts/);
  assert.match(html,/One primary contact per canonical client account/);
  assert.match(html,/Primary contact \/ company/);
  assert.match(html,/Role \/ business context/);
  assert.match(html,/Stakeholder/);
  assert.match(html,/QA contact/);
  assert.doesNotMatch(html,/New contact|Add contact/);
});

test('Onboarding rows prioritize lead identity and contactability over financial indicators',()=>{
  const html=render(ClientDirectoryRegister,{...props,onboarding:true});
  assert.match(html,/Lead accounts/);
  assert.match(html,/Added 2026-01-01/);
  assert.match(html,/Contact channels/);
  assert.doesNotMatch(html,/Service not recorded|Spend cap not configured|Billed value/);
});

test('Unavailable and loading client sources never render stale account rows or pagination',()=>{
  const unavailable=render(ClientDirectoryRegister,{...props,unavailable:true});
  assert.match(unavailable,/Client directory unavailable/);
  assert.match(unavailable,/Retry loading/);
  assert.match(unavailable,/ams-dashboard-empty--compact/);
  assert.doesNotMatch(unavailable,/QA creative|Canonical pagination|<table/);
  const loading=render(ClientDirectoryRegister,{...props,loading:true});
  assert.match(loading,/Loading client directory/);
  assert.doesNotMatch(loading,/QA creative|Canonical pagination|No client accounts/);
});

test('Valid empty and filtered empty account collections give distinct recovery guidance',()=>{
  const empty=render(ClientDirectoryRegister,{...props,records:[],hasAccounts:false});
  const filtered=render(ClientDirectoryRegister,{...props,records:[]});
  assert.match(empty,/No client accounts recorded/);
  assert.match(empty,/canonical client account/);
  assert.match(filtered,/No accounts match this view/);
  assert.match(filtered,/Adjust the search or filters/);
  assert.match(render(ClientDirectoryRegister,{...props,records:[],hasAccounts:false,onCreate:noop}),/Create client account/);
  assert.doesNotMatch(empty,/Reset filters/);
  assert.match(render(ClientDirectoryRegister,{...props,contacts:true,sortKey:'name'}),/aria-sort="ascending"/);
});

test('All agreement worksheets have unique navigable routes and exactly one current link',()=>{
  for(const tab of CLIENT_AGREEMENT_TABS){
    const html=render(ClientAgreementTabs,{activeKey:tab.key},tab.to);
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    assert.match(html,/ams-operational-tabs/);
    assert.doesNotMatch(html,/aria-disabled="true"/);
  }
  for(const tabs of [CLIENT_AGREEMENT_TABS,CLIENT_ONBOARDING_TABS,CLIENT_SERVICE_TABS]) assert.equal(new Set(tabs.map((x:any)=>x.to)).size,tabs.length);
});

test('All four service routes render their own evidence boundary with one selected worksheet',()=>{
  for(const tab of CLIENT_SERVICE_TABS){
    const html=render(AdminClientSlaMonitoring,{},tab.to);
    assert.match(html,/Service &amp; Health/);
    assert.ok(html.includes('data-ams-slug="client-source-'+tab.key+'"'));
    assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
    assert.doesNotMatch(html,/99\.9|\d+% uptime|aria-disabled="true"/);
  }
  const invalid=render(AdminClientSlaMonitoring,{},'/admin/clients/sla-monitoring?view=invalid');
  assert.match(invalid,/client-source-sla-monitoring/);
});

test('Unimplemented evidence has compact Overview states and real next actions, never simulated records',()=>{
  for(const worksheet of ['onboarding-checklist','required-documents','kickoff-readiness','history','sla-monitoring','service-issues','client-health','service-history']){
    const html=render(ClientSourceWorkspace,{worksheet});
    assert.match(html,/ams-operational-panel ams-overview-panel/);
    assert.match(html,/ams-dashboard-card-action/);
    assert.match(html,/ams-dashboard-empty--compact/);
    assert.match(html,/href="\/admin\//);
    assert.doesNotMatch(html,/Design preview|sample account|All checks complete|100%|<table/);
  }
  assert.match(render(ClientSourceWorkspace,{worksheet:'kickoff-readiness'}),/cannot authorize a kickoff/);
  assert.match(render(ClientSourceWorkspace,{worksheet:'history'}),/not reconstructed into a timeline/);
});

import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildSync} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {deliveryHref,deliveryParams,deliveryWorksheets,projectDeliverySignals,projectScheduleRows,resolveDeliveryProject,resolveDeliveryWorksheet,validDeliveryDate,type DeliveryWorkspace} from '../src/lib/projectDeliveryPresentation';
import {canAccessAmsRoute,type AmsRole} from '../src/lib/amsNavigationAccess';
import {getAmsModuleSubnavigation,isAmsModuleSubnavigationItemActive} from '../src/lib/amsModuleSubnavigation';
import type {AgencyProject} from '../src/lib/projectStore';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=buildSync({entryPoints:[path.join(root,'src/components/admin/projects/ProjectDeliveryWorkspaces.tsx')],bundle:true,write:false,platform:'node',format:'cjs',packages:'external',alias:{'lucide-react':path.join(root,'src/lib/untitled-ui-icon-bridge.tsx')},loader:{'.css':'empty'}});
const compiled={exports:{} as any};const require=createRequire(import.meta.url);
new Function('require','module','exports',bundle.outputFiles[0].text)(require,compiled,compiled.exports);
const {ProjectDeliveryWorkspaces,DeliveryRegister}=compiled.exports;
const {MemoryRouter}=require('react-router-dom');
const project:AgencyProject={id:'qa-canonical-id',slug:'different-project-slug',name:'QA Creative & IT delivery',clientName:'QA client',clientCompany:'QA company',clientEmail:'',serviceCategory:'Web development',status:'completed',budget:1000,progressPercent:75,startDate:'',targetEndDate:'2020-01-01',teamLead:'QA delivery lead',teamMembers:['QA specialist'],techStack:['Figma','TypeScript'],notes:'QA brief with <unsafe> markup as text.',milestones:[{id:'qa-ms',title:'QA review checkpoint',dueDate:'2026-02-30',completed:false}],tasks:[{id:'qa-task',title:'QA production handover',description:'Recorded QA brief',status:'done',priority:'high',assignedTo:'',dueDate:'',createdAt:'2026-01-01',tags:['waiting'],subtasks:[]}],createdAt:'2026-01-01',updatedAt:'2026-01-01'};
const noop=()=>{};
const render=(workspace:DeliveryWorkspace,worksheet?:string,overrides:Record<string,unknown>={},selected=project.id)=>renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[deliveryHref(new URLSearchParams(),workspace,worksheet||deliveryWorksheets[workspace][0].key,selected)]},React.createElement(ProjectDeliveryWorkspaces,{workspace,projects:[project],loading:false,available:true,onRefresh:noop,onOpen:noop,canAccess:()=>true,recordedCost:()=>null,formatMoney:(n:number)=>'IDR '+n,formatDate:(s:string)=>s,...overrides})));

test('All four workspace worksheet routes preserve canonical scope and normalize invalid tabs',()=>{
  for(const workspace of Object.keys(deliveryWorksheets) as DeliveryWorkspace[]){
    const params=new URLSearchParams('unrelated=keep');
    for(const item of deliveryWorksheets[workspace]){
      const target=new URL(deliveryHref(params,workspace,item.key,project.id),'https://ams.kapitech.local');
      assert.equal(target.searchParams.get('unrelated'),'keep');
      assert.equal(target.searchParams.get(deliveryParams[workspace].project),project.id);
      assert.equal(target.searchParams.get(deliveryParams[workspace].view),item.key);
    }
    assert.equal(resolveDeliveryWorksheet(workspace,'invalid'),deliveryWorksheets[workspace][0].key);
  }
  assert.equal(resolveDeliveryProject([project],'bad-id'),null);
  assert.equal(resolveDeliveryProject([project],project.slug!),project);
  assert.equal(resolveDeliveryProject([project],''),project);
});

test('New workspace links have exactly one active module tab and preserve existing role policy',()=>{
  for(const workspace of Object.keys(deliveryWorksheets) as DeliveryWorkspace[]){
    const tabs=getAmsModuleSubnavigation('projects','Admin');
    const current=tabs.filter(item=>isAmsModuleSubnavigationItemActive(item,'/admin/projects','?projects='+workspace,'','Admin'));
    assert.equal(current.length,1);
    assert.equal(current[0].key,workspace==='controls'?'controls':workspace);
    assert.notEqual(current[0].available,false);
    for(const role of ['Admin','PM','Finance','Creative','Freelancer'] as AmsRole[])assert.equal(canAccessAmsRoute(role,'/admin/projects','?projects='+workspace),['Admin','PM'].includes(role));
  }
});

test('Recorded schedule retains missing/invalid dates without invented ranges or milestone owners',()=>{
  assert.equal(validDeliveryDate('2026-02-30'),false);
  assert.equal(validDeliveryDate('2024-02-29'),true);
  assert.equal(validDeliveryDate(''),false);
  const rows=projectScheduleRows(project);
  assert.equal(rows.length,4);
  assert.ok(rows.some(row=>row.kind==='Task'&&row.date===''));
  assert.equal(rows.find(row=>row.kind==='Milestone')?.owner,'Not recorded per milestone');
  const html=render('planning-delivery','timeline');
  assert.match(html,/Review date: 2026-02-30/);
  assert.match(html,/Not set/);
  assert.doesNotMatch(html,/14-day|Start today|Dependency cleared/);
});

test('Planning brief, milestone state and invalid project recovery use actual records and shared controls',()=>{
  const brief=render('planning-delivery','brief');
  assert.match(brief,/QA brief with &lt;unsafe&gt; markup as text/);
  assert.match(brief,/Delivery context/);
  const milestones=render('planning-delivery','milestones');
  assert.match(milestones,/QA review checkpoint/);
  assert.match(milestones,/ams-filter-toolbar/);
  const invalid=render('planning-delivery','brief',{},'missing');
  assert.match(invalid,/Selected project unavailable/);
  assert.match(invalid,/Use default project/);
  assert.doesNotMatch(invalid,/QA brief with/);
});

test('Content views show canonical tasks and references but never fabricate campaign publication or metrics',()=>{
  const production=render('content-campaigns','production');
  assert.match(production,/QA production handover/);
  assert.match(production,/Channel, campaign identity and publication state are not recorded/);
  assert.match(render('content-campaigns','publishing'),/Publication records are not connected/);
  assert.match(render('content-campaigns','performance'),/Campaign results are not connected/);
  const unsafe=render('content-campaigns','assets',{projects:[{...project,figmaUrl:'javascript:alert(1)'}]});
  assert.match(unsafe,/Reference URL needs review/);
  assert.doesNotMatch(unsafe,/href="javascript:/);
});

test('Resources retain actual allocation dates, no fake global capacity and read-only edit gating',()=>{
  const record={...project,resourceAllocations:[{memberId:'qa-person',memberName:'QA specialist',allocationPercent:40,startDate:'2030-02-01',endDate:'2030-01-01'}]};
  const html=render('resources','allocations',{projects:[record],canAccess:()=>false});
  assert.match(html,/40%/);
  assert.match(html,/Review allocation dates/);
  assert.doesNotMatch(html,/Edit project|Open Team &amp; Resources/);
  assert.match(render('resources','capacity'),/Cross-project capacity is not connected/);
  assert.match(render('resources','ownership'),/Unassigned/);
});

test('Controls preserve completed blocked flags, distinguish absent Finance cost from zero and never imply closure acceptance',()=>{
  const signals=projectDeliverySignals(project,'2030-01-01');
  assert.ok(signals.some(row=>row.kind==='Blocked / waiting'&&row.task?.status==='done'));
  assert.ok(!signals.some(row=>row.kind==='Overdue task'));
  assert.match(render('controls','delivery'),/Blocked \/ waiting/);
  assert.match(render('controls','budget'),/Unavailable \/ not authorized/);
  assert.match(render('controls','budget',{recordedCost:()=>0}),/IDR 0/);
  assert.match(render('controls','changes'),/Change and risk registers are not connected/);
  assert.match(render('controls','handover'),/do not prove signed acceptance/);
});

test('All worksheets expose honest loading, unavailable and no-project states',()=>{
  for(const workspace of Object.keys(deliveryWorksheets) as DeliveryWorkspace[])for(const item of deliveryWorksheets[workspace]){
    assert.match(render(workspace,item.key,{loading:true,available:false}),/Loading delivery records/);
    const unavailable=render(workspace,item.key,{available:false});assert.match(unavailable,/Project records unavailable/);assert.doesNotMatch(unavailable,/QA production handover/);
    assert.match(render(workspace,item.key,{projects:[]},''),/No project records/);
  }
});

test('Delivery register supplies a named scrollable table and equivalent mobile records',()=>{
  const html=renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(DeliveryRegister,{rows:projectScheduleRows(project),formatDate:(s:string)=>s,onInspect:noop,caption:'QA schedule'})));
  assert.match(html,/role="region" aria-label="QA schedule" tabindex="0"/);
  assert.match(html,/scope="col"/);
  assert.match(html,/ams-delivery-register-cards/);
});

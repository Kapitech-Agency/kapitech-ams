import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Eye, FolderKanban, Pencil, RefreshCw } from 'lucide-react';
import type { AgencyProject, ProjectTask } from '../../../lib/projectStore';
import { deliveryHref, deliveryParams, deliveryWorksheets, hasTaskFlag, projectDeliverySignals, projectScheduleRows, resolveDeliveryProject, resolveDeliveryWorksheet, taskDeliveryState, validDeliveryDate, type DeliveryRow, type DeliveryWorkspace } from '../../../lib/projectDeliveryPresentation';
import { AdminDataTableShell, AdminPanel, AdminSectionTabs, AdminStatusBadge, AdminTablePagination, Skeleton } from '../AdminModulePrimitives';
import { AdminFilterField, AdminFilterToolbar } from '../AdminFilterToolbar';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import { CustomSelect } from '../../ui/CustomSelect';
import { Drawer } from '../../ui/Drawer';
import { ProfileIdentity } from '../ProfileIdentity';
import './ProjectDeliveryWorkspaces.css';

type Props = {
  workspace: DeliveryWorkspace;
  projects: AgencyProject[];
  loading: boolean;
  available: boolean;
  onRefresh: () => void;
  onOpen: (project: AgencyProject) => void;
  onEdit?: (project: AgencyProject) => void;
  canAccess: (href: string) => boolean;
  recordedCost: (id: string) => number | null;
  formatMoney: (value: number) => string;
  formatDate: (value: string) => string;
};
const panelClass = 'ams-operational-panel ams-overview-panel ams-delivery-panel';
const projectState = (project:AgencyProject) => ({planning:'Planning',in_progress:'In progress',review:'Review',completed:'Completed',on_hold:'On hold'})[project.status];
const taskState = taskDeliveryState;
const dateLabel = (date:string,format:(date:string)=>string) => !date ? 'Not set' : validDeliveryDate(date) ? format(date) : 'Review date: '+date;

export const DeliveryRegister: React.FC<{rows:DeliveryRow[];formatDate:(value:string)=>string;onInspect:(row:DeliveryRow)=>void;caption:string}> = ({rows,formatDate,onInspect,caption}) => <AdminDataTableShell embedded>
  <div className="ams-delivery-table-scroll custom-scrollbar" role="region" aria-label={caption} tabIndex={0}>
    <table className="ams-data-table"><caption className="sr-only">{caption}</caption><thead><tr><th scope="col">Record & context</th><th scope="col">Owner / assignee</th><th scope="col">Recorded date</th><th scope="col">State</th><th scope="col">Action</th></tr></thead>
      <tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.title}</strong><span>{row.kind}</span>{row.detail && <small>{row.detail}</small>}</td><td>{row.owner || 'Unassigned'}</td><td>{dateLabel(row.date,formatDate)}</td><td><AdminStatusBadge tone={/overdue|blocked|hold|review/i.test(row.kind+' '+row.state)?'warning':/done|completed/i.test(row.state)?'success':'neutral'}>{row.state}</AdminStatusBadge></td><td><DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Eye size={14}/>} onClick={()=>onInspect(row)} ariaLabel={'Inspect '+row.kind+': '+row.title}>Inspect</DashboardControl></td></tr>)}</tbody>
    </table>
  </div>
  <div className="ams-delivery-register-cards" role="list" aria-label={caption}>{rows.map(row=><article key={row.id} role="listitem" className="ams-delivery-record ams-overview-panel"><strong>{row.title}</strong><span>{row.kind}</span>{row.detail && <p>{row.detail}</p>}<dl><div><dt>Owner / assignee</dt><dd>{row.owner || 'Unassigned'}</dd></div><div><dt>Recorded date</dt><dd>{dateLabel(row.date,formatDate)}</dd></div><div><dt>State</dt><dd>{row.state}</dd></div></dl><DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Eye size={14}/>} onClick={()=>onInspect(row)} ariaLabel={'Inspect '+row.kind+': '+row.title}>Inspect</DashboardControl></article>)}</div>
</AdminDataTableShell>;

const References:React.FC<{project:AgencyProject}> = ({project}) => {
  const items=[['Design reference',project.figmaUrl],['Repository',project.repositoryUrl],['Live / staging',project.liveStagingUrl]].filter(([,url])=>Boolean(url));
  return items.length ? <div className="ams-delivery-references">{items.map(([label,url])=>{
    let safe=false;try{safe=['http:','https:'].includes(new URL(url!).protocol);}catch{}
    return <div key={label}><strong>{label}</strong>{safe ? <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" to={url!}>Open reference</DashboardControl>:<span>Reference URL needs review</span>}</div>;
  })}</div> : <DashboardEmptyState eyebrow="Project references" title="No reference links recorded" description="Design, repository and live/staging references appear here when recorded in the project."/>;
};

export const ProjectDeliveryWorkspaces:React.FC<Props> = p => {
  const [params,setParams]=useSearchParams();
  const keys=deliveryParams[p.workspace];
  const requested=params.get(keys.view);
  const worksheet=resolveDeliveryWorksheet(p.workspace,requested);
  const requestedProject=params.get(keys.project)||'';
  const project=resolveDeliveryProject(p.projects,requestedProject);
  const [query,setQuery]=useState('');
  const [kind,setKind]=useState('all');
  const [owner,setOwner]=useState('all');
  const [recordState,setRecordState]=useState('all');
  const [sort,setSort]=useState('date');
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(10);
  const [task,setTask]=useState<ProjectTask|null>(null);
  const [record,setRecord]=useState<DeliveryRow|null>(null);
  useEffect(()=>{setQuery('');setKind('all');setOwner('all');setRecordState('all');setPage(1);setTask(null);setRecord(null);},[project?.id,p.workspace,worksheet]);
  useEffect(()=>{setPage(1);},[query,kind,owner,recordState,sort,pageSize]);
  useEffect(()=>{setTask(current=>current?project?.tasks.find(item=>item.id===current.id)||null:null);setRecord(null);},[project]);
  useEffect(()=>{
    if(requested && requested!==worksheet){const next=new URLSearchParams(params);next.set(keys.view,worksheet);setParams(next,{replace:true});}
  },[requested,worksheet,keys.view,params,setParams]);
  const reset=()=>{setQuery('');setKind('all');setOwner('all');setRecordState('all');setSort('date');setPage(1);};
  const action=(label:string,href:string)=>p.canAccess(href)?<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" to={href}>{label}</DashboardControl>:null;
  const today=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})();
  const tasks=project?.tasks||[];
  const rows:DeliveryRow[] = !project ? [] : p.workspace==='planning-delivery' && worksheet==='milestones'
    ? project.milestones.map(item=>({id:item.id,title:item.title,kind:'Milestone',owner:'Not recorded per milestone',date:item.dueDate,state:item.completed?'Completed':validDeliveryDate(item.dueDate)&&item.dueDate<today?'Overdue':'Open'}))
    : p.workspace==='planning-delivery' && worksheet==='timeline' ? projectScheduleRows(project)
    : p.workspace==='controls' && worksheet==='delivery' ? projectDeliverySignals(project,today)
    : tasks.map(task=>({id:task.id,title:task.title,kind:hasTaskFlag(task)?'Blocked / waiting':'Task',owner:task.assignedTo,date:task.dueDate,state:taskState(task),task}));
  const filtered=rows.filter(row=>(kind==='all'||row.kind===kind)&&(recordState==='all'||row.state===recordState)&&(owner==='all'||(owner==='__unassigned__'?!row.owner.trim():'owner:'+row.owner===owner))&&[row.title,row.owner,row.kind,row.state,row.task?.description].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>sort==='title'?a.title.localeCompare(b.title):(validDeliveryDate(a.date)?a.date:'9999-99-99').localeCompare(validDeliveryDate(b.date)?b.date:'9999-99-99')||a.title.localeCompare(b.title));
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const safePage=Math.min(page,pageCount);
  const inspect=(row:DeliveryRow)=>row.task?setTask(row.task):setRecord(row);
  const register=(title:string,description:string,emptyTitle:string)=> <AdminPanel className={panelClass} title={title} description={description} headerDivider={false} bodyClassName="p-0">
    <AdminFilterToolbar slug="project-delivery-filters" searchValue={query} onSearchChange={setQuery} searchLabel={'Search '+title.toLowerCase()} searchPlaceholder="Search title, owner or state..." activeFilterCount={[kind,owner,recordState].filter(value=>value!=='all').length} onReset={reset} resetDisabled={!query&&kind==='all'&&owner==='all'&&recordState==='all'&&sort==='date'}>
      <AdminFilterField label="Record type"><CustomSelect aria-label="Filter delivery records by type" value={kind} onChange={setKind} options={[{value:'all',label:'All record types'},...[...new Set(rows.map(row=>row.kind))].map(value=>({value,label:value}))]}/></AdminFilterField>
      <AdminFilterField label="Owner / assignee"><CustomSelect aria-label="Filter delivery records by owner" value={owner} onChange={setOwner} options={[{value:'all',label:'All owners / assignees'},{value:'__unassigned__',label:'Unassigned'},...[...new Set(rows.map(row=>row.owner).filter(Boolean))].map(value=>({value:'owner:'+value,label:value}))]}/></AdminFilterField>
      <AdminFilterField label="Recorded state"><CustomSelect aria-label="Filter delivery records by state" value={recordState} onChange={setRecordState} options={[{value:'all',label:'All states'},...[...new Set(rows.map(row=>row.state))].map(value=>({value,label:value}))]}/></AdminFilterField>
      <AdminFilterField label="Sort order"><CustomSelect aria-label="Sort delivery records" value={sort} onChange={setSort} options={[{value:'date',label:'Recorded date · earliest first'},{value:'title',label:'Title · A–Z'}]}/></AdminFilterField>
    </AdminFilterToolbar>
    <p className="ams-delivery-result" role="status">{filtered.length} of {rows.length} records in this project</p>
    {filtered.length ? <DeliveryRegister rows={filtered.slice((safePage-1)*pageSize,safePage*pageSize)} formatDate={p.formatDate} onInspect={inspect} caption={title}/> : <div className="ams-delivery-pad"><DashboardEmptyState eyebrow={title} title={query||[kind,owner,recordState].some(value=>value!=='all')?'No records match these filters':emptyTitle} description={query||[kind,owner,recordState].some(value=>value!=='all')?'Adjust the search or clear filters to inspect the recorded work.':'Records will appear here when available in this project.'} action={query||[kind,owner,recordState].some(value=>value!=='all')?<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" onClick={reset}>Reset filters</DashboardControl>:undefined}/></div>}
    {rows.length>0 && <AdminTablePagination total={filtered.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="records"/>}
  </AdminPanel>;
  const unavailable=(eyebrow:string,title:string,description:string,children?:React.ReactNode)=> <AdminPanel className={panelClass} title={eyebrow} headerDivider={false}><div className="ams-delivery-pad"><DashboardEmptyState eyebrow="Source not connected" title={title} description={description} icon={<CalendarDays size={17}/>} action={<div className="ams-delivery-actions">{children}</div>}/></div></AdminPanel>;
  const projectLink=(workspace:DeliveryWorkspace,view:string)=>project?deliveryHref(params,workspace,view,project.id):'';
  const executionHref=project?'/admin/projects?projects=sprint&project='+encodeURIComponent(project.id):'';
  const costs=project?p.recordedCost(project.id):null;

  return <div className="ams-delivery-workspace" data-ams-feature-slug={'projects-'+p.workspace+'-workspace'}>
    <section className="ams-delivery-scope" aria-label="Project context">
      <div><span className="ams-delivery-eyebrow">Project context</span><strong>{project?.name || (requestedProject?'Selected project unavailable':'Choose a project')}</strong><span>{project?.clientCompany || project?.clientName || 'No client context loaded'}</span></div>
      <div className="ams-delivery-project-picker"><label>Project</label><CustomSelect aria-label="Select project for delivery workspace" value={project?.id||''} disabled={p.loading||!p.available||!p.projects.length} onChange={value=>{const next=new URLSearchParams(params);value?next.set(keys.project,value):next.delete(keys.project);setParams(next);}} options={[...(!project?[{value:'',label:'Choose a project...'}]:[]),...p.projects.map(item=>({value:item.id,label:item.name}))]}/></div>
      {project && p.available && <div className="ams-delivery-actions ams-overview-panel">{validDeliveryDate(project.startDate)&&validDeliveryDate(project.targetEndDate)&&project.targetEndDate<project.startDate&&<AdminStatusBadge tone="warning">Review schedule dates</AdminStatusBadge>}<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Eye size={14}/>} disabled={p.loading} onClick={()=>p.onOpen(project)}>Project details</DashboardControl>{p.onEdit && <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Pencil size={14}/>} disabled={p.loading} onClick={()=>p.onEdit?.(project)}>Edit project</DashboardControl>}</div>}
    </section>
    <AdminSectionTabs ariaLabel="Project workspace worksheets" className="ams-operational-tabs" activeKey={worksheet} items={deliveryWorksheets[p.workspace].map(item=>({key:item.key,label:item.label,to:deliveryHref(params,p.workspace,item.key)}))}/>
    {p.loading&&!p.available ? <AdminPanel className={panelClass} title="Loading project context"><div className="ams-delivery-pad" role="status" aria-label="Loading delivery records"><Skeleton className="h-24 w-full"/></div></AdminPanel>
    : !p.available ? unavailable('Project source','Project records unavailable','Refresh the canonical project source before inspecting delivery work.',<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<RefreshCw size={14}/>} onClick={p.onRefresh}>Retry projects</DashboardControl>)
    : !project ? unavailable('Project context',requestedProject?'Selected project unavailable':'No project records',requestedProject?'This project ID or slug was not returned by the current project source. Choose an available project.':'Add a project through Project Registry to begin planning and delivery.',<>{requestedProject&&<DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" onClick={()=>{const next=new URLSearchParams(params);next.delete(keys.project);setParams(next);}}>Use default project</DashboardControl>}{action('Open Project Registry','/admin/projects?projects=all')}</>)
    : <>
      {p.workspace==='planning-delivery' && worksheet==='brief' && <div className="ams-delivery-grid">
        <AdminPanel className={panelClass} title="Project brief" description="Recorded context for creative production and technology delivery." headerDivider={false}><div className="ams-delivery-pad"><div className="ams-delivery-brief">{project.notes?.trim() ? <p>{project.notes}</p> : <DashboardEmptyState eyebrow="Project brief" title="Brief notes are not recorded" description="Use the existing project editor to record the delivery brief and project context."/>}</div><div className="ams-delivery-actions">{action('Open project tasks',executionHref)}{action('Review milestones',projectLink('planning-delivery','milestones'))}</div></div></AdminPanel>
        <AdminPanel className={panelClass} title="Delivery context" headerDivider={false}><div className="ams-delivery-pad"><dl className="ams-delivery-facts">{[['Client',project.clientCompany||project.clientName||'Not linked'],['Project owner',project.teamLead||'Unassigned'],['Service',project.serviceCategory||'Not specified'],['Lifecycle',projectState(project)],['Start',dateLabel(project.startDate,p.formatDate)],['Target deadline',dateLabel(project.targetEndDate,p.formatDate)],['Technology / tools',project.techStack.join(', ')||'Not recorded']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div></AdminPanel>
      </div>}
      {p.workspace==='planning-delivery' && worksheet==='milestones' && register('Milestones','Recorded dates and completion; owners and prerequisite relationships are not stored per milestone.','No milestones recorded')}
      {p.workspace==='planning-delivery' && worksheet==='timeline' && register('Project timeline','Chronological recorded dates, followed by missing or invalid dates for review. No delivery ranges are invented.','No schedule records')}
      {p.workspace==='planning-delivery' && worksheet==='brief' && <details className="ams-delivery-capability"><summary>Scope, deliverables and review records</summary><p>Separate deliverable acceptance criteria, versioned internal/client review and revision history are not connected to this project source. Recorded task Review is a task stage, not client acceptance.</p></details>}

      {p.workspace==='content-campaigns' && worksheet==='production' && <><div className="ams-delivery-note">This register uses the selected project's canonical tasks. Channel, campaign identity and publication state are not recorded on these tasks.</div>{register('Project production tasks','Inspect creative or technology production work, its assignee, due date and task stage.','No production tasks recorded')}</>}
      {p.workspace==='content-campaigns' && worksheet==='assets' && <AdminPanel className={panelClass} title="Assets & references" description="Existing project links; these are not a versioned asset library." headerDivider={false}><div className="ams-delivery-pad"><References project={project}/><div className="ams-delivery-actions">{action('Open Documents','/admin/documents')}{action('Review project brief',projectLink('planning-delivery','brief'))}</div></div></AdminPanel>}
      {p.workspace==='content-campaigns' && worksheet==='publishing' && unavailable('Calendar & publishing','Publication records are not connected','Campaign channels, planned publish dates, approvals and confirmed publication links require their own source. Task deadlines remain available in the delivery timeline.',action('Open delivery timeline',projectLink('planning-delivery','timeline')))}
      {p.workspace==='content-campaigns' && worksheet==='performance' && unavailable('Campaign performance','Campaign results are not connected','No source currently records campaign identity, KPI definitions, reporting period or verified results. This view does not fabricate reach, conversion or return on spend.',action('Open production work',projectLink('content-campaigns','production')))}

      {p.workspace==='resources' && worksheet==='allocations' && <div className="ams-delivery-grid">
        <AdminPanel className={panelClass} title="Recorded resource allocation" description="Percentages describe individual project allocation entries, not global availability." headerDivider={false}><div className="ams-delivery-pad">{project.resourceAllocations?.length ? <div className="ams-delivery-allocation-list">{project.resourceAllocations.map((item,index)=><article key={item.memberId+'-'+index} className="ams-delivery-record"><strong>{item.memberName||item.memberId||'Member reference missing'}</strong><dl className="ams-delivery-facts"><div><dt>Recorded allocation</dt><dd>{Number.isFinite(item.allocationPercent)?item.allocationPercent+'%':'Not recorded'}</dd></div><div><dt>Starts</dt><dd>{dateLabel(item.startDate,p.formatDate)}</dd></div><div><dt>Ends</dt><dd>{dateLabel(item.endDate,p.formatDate)}</dd></div></dl>{validDeliveryDate(item.startDate)&&validDeliveryDate(item.endDate)&&item.endDate<item.startDate&&<AdminStatusBadge tone="warning">Review allocation dates</AdminStatusBadge>}</article>)}</div>:<DashboardEmptyState eyebrow="Allocations" title="No allocation entries recorded" description="Inspect the project team and task ownership before coordinating assignment changes."/>}</div></AdminPanel>
        <AdminPanel className={panelClass} title="Assigned project team" headerDivider={false}><div className="ams-delivery-pad ams-delivery-team">{[...new Set([project.teamLead,...project.teamMembers,...(project.resourceAllocations||[]).map(item=>item.memberName)].map(name=>String(name||'').trim()).filter(Boolean))].map(name=><div key={name}><ProfileIdentity profile={{name,contextLabel:'Project team'}} showRole={false}/><span>{name===project.teamLead?'Project owner':'Project team / allocation'}</span></div>)}{!project.teamLead&&!project.teamMembers.length&&!project.resourceAllocations?.length&&<DashboardEmptyState eyebrow="Team" title="No project team recorded" description="Record the project owner and team through the existing project editor."/>}<div className="ams-delivery-actions">{action('Review task ownership',projectLink('resources','ownership'))}{action('Open Team & Resources','/admin/team')}</div></div></AdminPanel>
      </div>}
      {p.workspace==='resources' && worksheet==='ownership' && register('Task ownership','Recorded assignee references and task states. Unassigned work stays visible; task counts do not represent capacity.','No tasks recorded for this team')}
      {p.workspace==='resources' && worksheet==='capacity' && unavailable('Capacity & conflicts','Cross-project capacity is not connected','Allocation entries do not provide a complete availability denominator, approved time off or cross-project conflict record. Inspect the existing Team and Time Tracking sources.',<>{action('Open Team & Resources','/admin/team')}{action('Open Time Tracking','/admin/time-logs')}</>)}

      {p.workspace==='controls' && worksheet==='delivery' && register('Delivery signals','Source-backed schedule, task review, ownership and blocked/waiting flags. These are operational signals, not a persisted risk register.','No delivery signals in these records')}
      {p.workspace==='controls' && worksheet==='changes' && unavailable('Changes & risks','Change and risk registers are not connected','Change requests, impact decisions, risk owners, mitigations and decision history require canonical records. Existing delivery signals and project notes remain inspectable.',<>{action('Inspect delivery signals',projectLink('controls','delivery'))}{action('Review project brief',projectLink('planning-delivery','brief'))}</>)}
      {p.workspace==='controls' && worksheet==='budget' && <AdminPanel className={panelClass} title="Budget & actuals" description="Project budget and the existing Finance-linked expense projection, using its current currency and inclusion rules." headerDivider={false}><div className="ams-delivery-pad"><dl className="ams-delivery-facts"><div><dt>Recorded project budget</dt><dd>{p.formatMoney(project.budget)}</dd></div><div><dt>Recorded expenses</dt><dd>{costs===null?'—':p.formatMoney(costs)}</dd></div><div><dt>Expense source</dt><dd>{costs===null?'Unavailable / not authorized':'Existing Finance expense records'}</dd></div></dl><p className="ams-delivery-note">Recorded expenses are not a forecast, revenue or profit. No new variance or profitability formula is calculated in this workspace.</p><div className="ams-delivery-actions">{action('Open Project Finance','/admin/finance?tab=project-finance')}</div></div></AdminPanel>}
      {p.workspace==='controls' && worksheet==='handover' && <div className="ams-delivery-grid"><AdminPanel className={panelClass} title="Handover & closure evidence" headerDivider={false}><div className="ams-delivery-pad"><dl className="ams-delivery-facts"><div><dt>Recorded lifecycle</dt><dd>{projectState(project)}</dd></div><div><dt>Open tasks</dt><dd>{tasks.filter(item=>item.status!=='done').length}</dd></div><div><dt>Open milestones</dt><dd>{project.milestones.filter(item=>!item.completed).length}</dd></div><div><dt>Recorded project progress</dt><dd>{project.progressPercent}%</dd></div></dl><p className="ams-delivery-note">Completed status and checklist totals do not prove signed acceptance, handover approval or formal closure.</p><div className="ams-delivery-actions">{action('Review task records',executionHref)}{action('Review milestones',projectLink('planning-delivery','milestones'))}</div></div></AdminPanel><AdminPanel className={panelClass} title="Related project references" headerDivider={false}><div className="ams-delivery-pad"><References project={project}/><div className="ams-delivery-actions">{action('Open Documents','/admin/documents')}</div></div></AdminPanel></div>}
    </>}
    <Drawer open={Boolean(task||record)} onClose={()=>{setTask(null);setRecord(null);}} title={task?.title||record?.title||'Delivery record'} description={project?.name} size="xl" footer={<><DashboardControl variant="action" onClick={()=>{setTask(null);setRecord(null);}}>Close</DashboardControl>{project&&p.canAccess(executionHref)&&<DashboardControl variant="action" to={executionHref}>Open project tasks</DashboardControl>}</>}>
      {task ? <div className="ams-delivery-detail"><h3>Task brief</h3><p>{task.description||'No task brief recorded.'}</p><dl className="ams-delivery-facts"><div><dt>Stage</dt><dd>{taskState(task)}</dd></div><div><dt>Assignee reference</dt><dd>{task.assignedTo||'Unassigned'}</dd></div><div><dt>Due date</dt><dd>{dateLabel(task.dueDate,p.formatDate)}</dd></div><div><dt>Priority</dt><dd>{task.priority}</dd></div><div><dt>Tags</dt><dd>{task.tags?.join(', ')||'No tags'}</dd></div></dl><h3>Recorded checklist</h3>{task.subtasks?.length?<ul>{task.subtasks.map(item=><li key={item.id}>{item.completed?'Completed':'Open'} · {item.title}</li>)}</ul>:<p>No checklist recorded.</p>}</div>
      : record && <div className="ams-delivery-detail"><dl className="ams-delivery-facts"><div><dt>Record type</dt><dd>{record.kind}</dd></div><div><dt>Owner</dt><dd>{record.owner||'Unassigned'}</dd></div><div><dt>Recorded date</dt><dd>{dateLabel(record.date,p.formatDate)}</dd></div><div><dt>State</dt><dd>{record.state}</dd></div></dl><p>{record.detail||'Inspect the underlying project before changing delivery records.'}</p>{project&&<DashboardControl variant="action" icon={<FolderKanban size={14}/>} onClick={()=>{setRecord(null);p.onOpen(project);}}>Open project details</DashboardControl>}</div>}
    </Drawer>
  </div>;
};

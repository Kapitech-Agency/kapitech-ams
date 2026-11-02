import type { AgencyProject, ProjectTask } from './projectStore';

export type DeliveryWorkspace = 'planning-delivery' | 'content-campaigns' | 'resources' | 'controls';
export const deliveryWorksheets = {
  'planning-delivery': [{key:'brief',label:'Project Brief'},{key:'milestones',label:'Milestones'},{key:'timeline',label:'Timeline'}],
  'content-campaigns': [{key:'production',label:'Production Work'},{key:'assets',label:'Assets & References'},{key:'publishing',label:'Calendar & Publishing'},{key:'performance',label:'Campaign Performance'}],
  resources: [{key:'allocations',label:'Team & Allocations'},{key:'ownership',label:'Task Ownership'},{key:'capacity',label:'Capacity & Conflicts'}],
  controls: [{key:'delivery',label:'Delivery Signals'},{key:'changes',label:'Changes & Risks'},{key:'budget',label:'Budget & Actuals'},{key:'handover',label:'Handover & Closure'}],
} as const;
export const deliveryParams: Record<DeliveryWorkspace,{view:string;project:string}> = {
  'planning-delivery':{view:'planningView',project:'planningProject'},
  'content-campaigns':{view:'contentView',project:'contentProject'},
  resources:{view:'resourceView',project:'resourcesProject'},
  controls:{view:'controlView',project:'controlsProject'},
};
export const resolveDeliveryWorksheet = (workspace:DeliveryWorkspace,value:string|null):string => deliveryWorksheets[workspace].find(item=>item.key===value)?.key || deliveryWorksheets[workspace][0].key;
export const resolveDeliveryProject = <T extends AgencyProject>(projects:T[],id:string):T|null => id ? projects.find(project=>project.id===id || project.slug===id)||null : projects.find(project=>project.status!=='completed')||projects[0]||null;
export const deliveryHref = (params:URLSearchParams,workspace:DeliveryWorkspace,worksheet:string,projectId?:string):string => {
  const next=new URLSearchParams(params);
  next.set('projects',workspace);next.set(deliveryParams[workspace].view,resolveDeliveryWorksheet(workspace,worksheet));
  if(projectId!==undefined) projectId ? next.set(deliveryParams[workspace].project,projectId) : next.delete(deliveryParams[workspace].project);
  return '/admin/projects?'+next.toString();
};
/** Presentation validity only; never repairs or persists a source date. */
export const validDeliveryDate = (value:string):boolean => {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T12:00:00');
  return Number.isFinite(date.getTime()) && date.getFullYear()===Number(value.slice(0,4)) && date.getMonth()+1===Number(value.slice(5,7)) && date.getDate()===Number(value.slice(8,10));
};
export const hasTaskFlag = (task:ProjectTask) => (task.tags||[]).some(tag=>/^(blocked|blocker|blocked-by|waiting)$/i.test(tag));
export const taskDeliveryState = (task:ProjectTask):string => ({todo:'To do',in_progress:'In progress',review:'Review',done:'Done'})[task.status];
export type DeliveryRow = {id:string;title:string;kind:string;owner:string;date:string;state:string;detail?:string;task?:ProjectTask};
export const projectScheduleRows = (project:AgencyProject):DeliveryRow[] => [
  {id:'project-start',title:project.name,kind:'Project start',owner:project.teamLead,date:project.startDate,state:'Recorded start'},
  {id:'project-target',title:project.name,kind:'Project target',owner:project.teamLead,date:project.targetEndDate,state:'Target deadline'},
  ...project.milestones.map(item=>({id:'milestone-'+item.id,title:item.title,kind:'Milestone',owner:'Not recorded per milestone',date:item.dueDate,state:item.completed?'Completed':'Open'})),
  ...project.tasks.map(task=>({id:'task-'+task.id,title:task.title,kind:'Task',owner:task.assignedTo,date:task.dueDate,state:taskDeliveryState(task),task})),
].sort((a,b)=>(validDeliveryDate(a.date)?a.date:'9999-99-99').localeCompare(validDeliveryDate(b.date)?b.date:'9999-99-99')||a.title.localeCompare(b.title));
export const projectDeliverySignals = (project:AgencyProject,today:string):DeliveryRow[] => {
  const rows:DeliveryRow[]=[];
  if(project.status==='on_hold')rows.push({id:'project-hold',title:project.name,kind:'Project on hold',owner:project.teamLead,date:project.targetEndDate,state:'On hold',detail:'Inspect project notes and coordinate the next delivery decision.'});
  if(project.status!=='completed' && validDeliveryDate(project.targetEndDate) && project.targetEndDate<today)rows.push({id:'project-overdue',title:project.name,kind:'Overdue target',owner:project.teamLead,date:project.targetEndDate,state:'Open',detail:'A target date is not an actual completion date.'});
  for(const task of project.tasks){
    const base={title:task.title,owner:task.assignedTo,date:task.dueDate,state:taskDeliveryState(task),task};
    if(hasTaskFlag(task))rows.push({...base,id:'flag-'+task.id,kind:'Blocked / waiting',detail:task.description||'Inspect the recorded task brief and tags.'});
    if(task.status!=='done' && validDeliveryDate(task.dueDate) && task.dueDate<today)rows.push({...base,id:'due-'+task.id,kind:'Overdue task'});
    if(task.status==='review')rows.push({...base,id:'review-'+task.id,kind:'Task in review',detail:'Task stage; client acceptance is not recorded here.'});
    if(task.status!=='done' && !task.assignedTo.trim())rows.push({...base,id:'owner-'+task.id,kind:'Unassigned task'});
  }
  for(const item of project.milestones)if(!item.completed && validDeliveryDate(item.dueDate) && item.dueDate<today)rows.push({id:'milestone-'+item.id,title:item.title,kind:'Overdue milestone',owner:'Not recorded per milestone',date:item.dueDate,state:'Open'});
  return rows;
};

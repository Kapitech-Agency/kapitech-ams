import React from 'react';
import { Eye, FolderKanban, Pencil } from 'lucide-react';
import type { AgencyProject } from '../../../lib/projectStore';
import { AdminDataTableShell, AdminStatusBadge } from '../AdminModulePrimitives';
import { DashboardControl } from '../DashboardControls';
import { DashboardEmptyState } from '../DashboardEmptyState';
import { ProfileIdentity } from '../ProfileIdentity';

type RegistryProject = AgencyProject & { slug: string; health?: 'Good' | 'At Risk' | 'Delayed' | 'Blocked' };
type RecordProps = {
  project: RegistryProject;
  archived?: boolean;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  isOverdue: (value: string) => boolean;
  recordedCost: number | null;
  onOpen: (project: RegistryProject) => void;
  onDelivery: (project: RegistryProject) => void;
  onEdit?: (project: RegistryProject) => void;
};

const statusLabels = { planning: 'Planning', in_progress: 'In progress', review: 'Review', on_hold: 'On hold', completed: 'Completed' };
const statusTones = { planning: 'info', in_progress: 'info', review: 'warning', on_hold: 'warning', completed: 'success' } as const;

const Identity = ({ project, onOpen, archived }: Pick<RecordProps, 'project' | 'onOpen' | 'archived'>) => (
  <div className="ams-registry-identity">
    <button type="button" onClick={() => onOpen(project)} aria-label={'Open project ' + project.name}>{project.name}</button>
    <span>{project.clientCompany || project.clientName || 'Client not linked'}</span>
    <small>{project.serviceCategory || 'Service not specified'} <span aria-hidden="true">&middot;</span> {project.slug}</small>
    {archived && <small>Saved references: {[project.figmaUrl && 'Design', project.repositoryUrl && 'Repository', project.liveStagingUrl && 'Staging'].filter(Boolean).join(' / ') || 'None recorded'}</small>}
  </div>
);

const State = ({ project }: Pick<RecordProps, 'project'>) => (
  <div className="ams-registry-state">
    <AdminStatusBadge tone={statusTones[project.status]}>{statusLabels[project.status]}</AdminStatusBadge>
    {project.health ? <AdminStatusBadge tone={project.health === 'Good' ? 'success' : project.health === 'Blocked' || project.health === 'Delayed' ? 'danger' : 'warning'}><span className="sr-only">Health: </span>{project.health}</AdminStatusBadge> : <span className="ams-registry-health">Health unavailable</span>}
  </div>
);

const Schedule = ({ project, formatDate, isOverdue }: Pick<RecordProps, 'project' | 'formatDate' | 'isOverdue'>) => {
  const milestone = [...project.milestones].filter(item => !item.completed)
    .sort((left, right) => (left.dueDate || '9999-12-31').localeCompare(right.dueDate || '9999-12-31'))[0];
  return <div className="ams-registry-schedule">
    <span className={project.status !== 'completed' && isOverdue(project.targetEndDate) ? 'text-danger' : 'text-fg'}>{project.targetEndDate ? formatDate(project.targetEndDate) : 'No target deadline'}</span>
    <small>Start: {project.startDate ? formatDate(project.startDate) : 'Not set'}</small>
    <small>{milestone ? 'Next: ' + milestone.title : project.milestones.length ? 'All milestones completed' : 'No milestone recorded'}</small>
    {milestone && <small className={isOverdue(milestone.dueDate) ? 'text-danger' : ''}>{milestone.dueDate ? formatDate(milestone.dueDate) : 'Milestone date not set'}</small>}
  </div>;
};

const Delivery = ({ project, recordedCost, formatMoney }: Pick<RecordProps, 'project' | 'recordedCost' | 'formatMoney'>) => (
  <div className="ams-registry-delivery">
    <div><span>Delivery progress</span><strong>{project.progressPercent}%</strong></div>
    <div className="ams-registry-progress" role="progressbar" aria-label={'Recorded progress for ' + project.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={project.progressPercent}><span style={{ width: project.progressPercent + '%' }} /></div>
    <small>{project.tasks.filter(task => task.status === 'done').length}/{project.tasks.length} tasks done</small>
    <small>Recorded cost / budget</small>
    <span>{recordedCost === null ? '\u2014' : formatMoney(recordedCost)} / {formatMoney(project.budget)}</span>
    {recordedCost === null && <small>Finance data unavailable</small>}
  </div>
);

const Owner = ({ project }: Pick<RecordProps, 'project'>) => project.teamLead
  ? <ProfileIdentity profile={{ name: project.teamLead, contextLabel: 'Project owner' }} showRole={false} />
  : <span className="text-muted">Owner not assigned</span>;

const Actions = ({ project, onOpen, onEdit, onDelivery }: Pick<RecordProps, 'project' | 'onOpen' | 'onEdit' | 'onDelivery'>) => (
  <div className="ams-registry-actions">
    <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Eye size={14} />} onClick={() => onOpen(project)} ariaLabel={'View project ' + project.name}>View</DashboardControl>
    <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<FolderKanban size={14} />} onClick={() => onDelivery(project)} ariaLabel={'Open delivery for ' + project.name}>Delivery</DashboardControl>
    {onEdit && <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" icon={<Pencil size={14} />} onClick={() => onEdit(project)} ariaLabel={'Edit project ' + project.name}>Edit</DashboardControl>}
  </div>
);

/** One record presentation for Registry cards, compact tables and completed history. */
export const ProjectRegistryCard: React.FC<RecordProps & { dragHandle?: React.ReactNode }> = props => (
  <div className="ams-registry-card-content">
    <div className="ams-registry-card-heading">{props.dragHandle}<Identity {...props} /><State project={props.project} /></div>
    <dl className="ams-registry-card-context">
      <div><dt>Project owner</dt><dd><Owner project={props.project} /></dd></div>
      <div><dt>Target deadline & milestone</dt><dd><Schedule {...props} /></dd></div>
    </dl>
    <Delivery {...props} />
    <Actions {...props} />
  </div>
);

export const ProjectRegistryRecords: React.FC<{
  rows: RegistryProject[];
  archived?: boolean;
  available: boolean;
  loading: boolean;
  hasRecords: boolean;
  hasFilters: boolean;
  onReset: () => void;
  getRecordedCost: (id: string) => number | null;
} & Omit<RecordProps, 'project' | 'recordedCost'>> = props => {
  const { rows, archived, loading, available, hasRecords, hasFilters, onReset } = props;
  if (loading) return <div className="ams-registry-loading" role="status" aria-label="Loading project registry">{[1, 2, 3, 4].map(item => <div key={item} className="h-20 animate-pulse rounded-control bg-bg" />)}</div>;
  if (!available || !rows.length) return <div className="ams-registry-empty"><DashboardEmptyState
    eyebrow={archived ? 'Completed project history' : 'Project Registry'}
    icon={<FolderKanban size={17} />}
    title={!available ? 'Project records unavailable' : hasRecords ? hasFilters ? 'No projects match this view' : 'No projects in this delivery stage' : archived ? 'No completed projects yet' : 'No projects have been created yet.'}
    description={!available ? 'Use Refresh to try loading project records again.' : hasRecords ? 'Review the selected lifecycle and filters to find the project you need.' : archived ? 'Completed projects remain available here for handover and reference.' : 'Create a project to define the client, service, owner and delivery schedule.'}
    action={available && hasFilters ? <DashboardControl variant="action" size="compact" className="ams-dashboard-card-action" onClick={onReset}>Reset filters</DashboardControl> : undefined}
  /></div>;
  return <AdminDataTableShell embedded className="ams-registry-records" slug={archived ? 'projects-archived-records' : 'projects-registry-records'}>
    <div className="ams-registry-compact-records" data-ams-feature-slug={archived ? 'projects-archived-cards' : 'projects-table-cards'} role="list" aria-label={archived ? 'Archived project cards' : 'Project portfolio cards'}>
      {rows.map(project => <article key={project.id} role="listitem" className="ams-registry-compact-record ams-overview-panel" data-ams-slug={(archived ? 'archived-project-card-' : 'project-portfolio-card-') + project.id}>
        <ProjectRegistryCard {...props} project={project} recordedCost={props.getRecordedCost(project.id)} />
      </article>)}
    </div>
    <div className="ams-registry-table-scroll custom-scrollbar" role="region" tabIndex={0} aria-label={archived ? 'Scrollable archived project register' : 'Scrollable project register table'}>
      <table className="ams-data-table ams-projects-table">
        <caption className="sr-only">{archived ? 'Completed project history. Target deadlines are not completion timestamps.' : 'Project delivery register: identity, status, ownership, schedule, progress and actions.'}</caption>
        <thead><tr><th scope="col">Project & client</th><th scope="col">Status & health</th><th scope="col">Owner / PIC</th><th scope="col">Target deadline & milestone</th><th scope="col">Delivery & budget</th><th scope="col">Actions</th></tr></thead>
        <tbody>{rows.map(project => {
          const record = { ...props, project, recordedCost: props.getRecordedCost(project.id) };
          return <tr key={project.id}><td><Identity {...record} /></td><td><State project={project} /></td><td><Owner project={project} /></td><td><Schedule {...record} /></td><td><Delivery {...record} /></td><td><Actions {...record} /></td></tr>;
        })}</tbody>
      </table>
    </div>
  </AdminDataTableShell>;
};

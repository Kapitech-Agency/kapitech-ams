import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { Plus, Trash2, RefreshCw, CalendarDays, Timer, ReceiptText } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import { toSlug } from '../../lib/slug';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminMetricStrip, AdminModuleHeader, AdminPageShell, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { Drawer } from '../../components/ui/Drawer';


const isUnknownMutationOutcome = (response: { success: boolean; status?: number }) =>
  !response.success && (response.status === undefined || response.status >= 500);

type TimeLog = {
  id: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  user?: string;
  userId?: string;
  durationMinutes: number;
  billable?: boolean;
  date: string;
  notes?: string;
  createdAt: string;
  slug?: string;
};

export const AdminTimeLogs: React.FC = () => {
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const canManage = hasAdminPermission('canManageProjects') || hasAdminPermission('canManageKanbanTasks');
  const canDeleteAll = hasAdminPermission('canManageProjects');
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [canRetryLoad, setCanRetryLoad] = useState(false);
  const showStatus = (message: string | null, tone: 'success' | 'error' | 'info' = 'error', retryLoad = false) => {
    setStatus(message);
    setCanRetryLoad(Boolean(message && retryLoad));
    if (message) setStatusTone(tone);
  };
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [taskId, setTaskId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const selectedProject = projects.find((project) => project.id === projectId);
  const selectedProjectTasks: Array<{ id: string; title: string }> = Array.isArray(selectedProject?.tasks)
    ? selectedProject.tasks.filter((task: any) => task && typeof task.id === 'string' && typeof task.title === 'string')
    : [];
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TimeLog | null>(null);

  const load = async (showLoading = true): Promise<boolean> => {
    if (showLoading) setLoading(true);
    showStatus(null);
    try {
      const [logsRes, projectsRes] = await Promise.all([
        api.timeLogs.getAll(),
        api.projects.getAll()
      ]);
      const logsLoaded = logsRes.success && Array.isArray(logsRes.data?.timeLogs);

      if (logsLoaded) {
        setLogs(logsRes.data!.timeLogs.map((log: TimeLog) => ({
          ...log,
          slug: log.slug || toSlug((log.taskTitle || log.projectName || 'time-log') + '-' + log.id, 'time-log-record')
        })));
      } else {
        showStatus(logsRes.error || 'Unable to load time logs. Previously loaded records are kept.', 'error', true);
      }

      if (projectsRes?.success && Array.isArray(projectsRes.data?.projects)) {
        setProjects(projectsRes.data.projects.map((project: any) => ({
          ...project,
          slug: project.slug || toSlug(project.name || project.id, 'project-record')
        })));
      } else if (!projectsRes?.success && logsLoaded) {
        showStatus(projectsRes?.error || 'Unable to load projects. Previously loaded project options are kept.', 'error', true);
      }
      return logsLoaded;
    } catch (error) {
      showStatus(error instanceof Error ? error.message : 'Unable to load time logs. Previously loaded records are kept.', 'error', true);
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const periodLogs = useMemo(() => logs.filter((log) => matchesDate(log.date)), [logs, matchesDate]);
  const totalMinutes = useMemo(() => periodLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0), [periodLogs]);
  const billableMinutes = useMemo(() => periodLogs.filter(log => log.billable).reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0), [periodLogs]);
  const totalPages = Math.max(1, Math.ceil(periodLogs.length / pageSize));
  const pagedLogs = periodLogs.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [reportPeriodValue, reportPeriodEnabled]);
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const project = projects.find(item => item.id === id);
    setProjectName(project?.name || '');
    setTaskId('');
    setTaskTitle('');
  };

  const handleTaskChange = (id: string) => {
    setTaskId(id);
    const task = selectedProjectTasks.find((item) => item.id === id);
    if (task) setTaskTitle(task.title);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage || saving) return;
    if (!projectId) {
      showStatus('Select a project before logging time.');
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
      showStatus('Duration must be between 1 and 1,440 minutes.');
      return;
    }
    setSaving(true);
    showStatus(null);
    try {
      const res = await api.timeLogs.create({
        projectId,
        projectName,
        taskId: taskId || undefined,
        taskTitle,
        durationMinutes,
        billable,
        date,
        notes
      });
      if (res.success && res.data?.timeLog) {
        setLogs(current => [res.data!.timeLog, ...current]);
        setPage(1);
        setTaskId('');
        setTaskTitle('');
        setNotes('');
        setFormOpen(false);
        showStatus('Time entry saved.', 'success');
      } else {
        const unknownOutcome = isUnknownMutationOutcome(res)
          || (res.success && !res.data?.timeLog);
        if (unknownOutcome) {
          const refreshed = await load(false);
          setProjectId('');
          setProjectName('');
          setTaskId('');
          setTaskTitle('');
          setDurationMinutes(60);
          setBillable(true);
          setNotes('');
          showStatus((res.error || 'Time entry result could not be confirmed.') + (refreshed
            ? ' The canonical time log list was refreshed. Inspect it before entering the same work again.'
            : ' The time log list could not be confirmed. Do not retry until the server state has been checked.'), 'info', !refreshed);
        } else {
          showStatus(res.error || 'Time entry could not be saved.');
        }
      }
    } catch (error) {
      const refreshed = await load(false);
      setProjectId('');
      setProjectName('');
      setTaskId('');
      setTaskTitle('');
      setDurationMinutes(60);
      setBillable(true);
      setNotes('');
      showStatus((error instanceof Error ? error.message : 'Time entry result could not be confirmed.') + (refreshed
        ? ' The canonical time log list was refreshed. Inspect it before entering the same work again.'
        : ' The time log list could not be confirmed. Do not retry until the server state has been checked.'), 'info', !refreshed);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (log: TimeLog) => {
    if (!canManage || (!canDeleteAll && log.userId !== getAdminSession()?.user?.id)) return;
    setDeleteTarget(log);
  };

  const confirmRemove = async (log: TimeLog) => {
    try {
      const res = await api.timeLogs.delete(log.id);
      if (res.success) {
        setLogs(current => current.filter(item => item.id !== log.id));
        showStatus('Time entry deleted.', 'success');
      } else if (isUnknownMutationOutcome(res)) {
        const refreshed = await load(false);
        showStatus((res.error || 'Time entry deletion result could not be confirmed.') + (refreshed
          ? ' The canonical time log list was refreshed. Inspect it before trying again.'
          : ' The time log list could not be confirmed. Do not retry until the server state has been checked.'), 'info', !refreshed);
      } else {
        showStatus(res.error || 'Time entry could not be deleted.');
      }
    } catch (error) {
      const refreshed = await load(false);
      showStatus((error instanceof Error ? error.message : 'Time entry deletion result could not be confirmed.') + (refreshed
        ? ' The canonical time log list was refreshed. Inspect it before trying again.'
        : ' The time log list could not be confirmed. Do not retry until the server state has been checked.'), 'info', !refreshed);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AdminPageShell featureSlug="time-tracking-module">
      <AdminModuleHeader slug="time-tracking-header"
        className="mb-0"
        title="Time tracking"
        description="Record project time, billable hours, and activity notes in one consistent delivery workspace."
        actions={
          <>
            {canManage && (
              <Button
                type="button"
                variant="primary"
                icon={<Plus size={15} />}
                onClick={() => setFormOpen(true)}
              >
                Add time entry
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              icon={<RefreshCw size={14} />}
              loading={loading}
              onClick={() => void load()}
            >
              Refresh
            </Button>
          </>
        }
      />






        <Drawer
          slug="time-entry-drawer"
          open={formOpen}
          onClose={() => { if (!saving) setFormOpen(false); }}
          closeOnEscape={!saving}
          size="xl"
          title="New time entry"
          description="Record project time, billable hours, and activity notes."
          footer={(
            <>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" form="time-entry-form" variant="primary" loading={saving} disabled={saving}>Add entry</Button>
            </>
          )}
        >
          {canManage && (
            <form id="time-entry-form" data-ams-feature-slug="time-tracking-create-form" data-ams-slug="time-tracking-create-form" onSubmit={submit} className="space-y-5 p-4 sm:p-5">
              <section data-ams-drawer-layout="sections" className="grid gap-4 rounded-card border border-line bg-bg p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted">Project</span>
                    <CustomSelect value={projectId} onChange={handleProjectChange} options={[{ value: "", label: "Select project" }, ...projects.map(project => ({ value: project.id, label: project.name }))]} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted">Linked task</span>
                    <CustomSelect value={taskId} onChange={handleTaskChange} options={[{ value: "", label: "No linked task" }, ...selectedProjectTasks.map(task => ({ value: task.id, label: task.title }))]} disabled={!projectId || selectedProjectTasks.length === 0} aria-label="Linked task" className="w-full" triggerClassName="w-full" slug="time-entry-task-select" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted">Task / activity</span>
                    <input value={taskTitle} onChange={event => { setTaskTitle(event.target.value); if (selectedProjectTasks.find(task => task.id === taskId)?.title !== event.target.value) setTaskId(''); }} placeholder="Describe the work" className="ams-control w-full" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted">Duration (minutes)</span>
                    <input type="number" min={1} max={1440} value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))} className="ams-control w-full" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-muted">Date</span>
                    <input type="date" value={date} onChange={event => setDate(event.target.value)} className="ams-control w-full" />
                  </label>
                </div>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-muted">Notes</span>
                  <input value={notes} onChange={event => setNotes(event.target.value)} placeholder="Optional context" className="ams-control w-full" />
                </label>
                <label className="flex min-h-10 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-fg">
                  <input type="checkbox" checked={billable} onChange={event => setBillable(event.target.checked)} className="accent-accent" />
                  Billable time
                </label>
              </section>
            </form>
          )}
        </Drawer>

        {status && (
          <div role={statusTone === 'error' ? 'alert' : 'status'} aria-live={statusTone === 'error' ? 'assertive' : 'polite'} className={'flex flex-col gap-2 rounded-card border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between ' + (statusTone === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : statusTone === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-line bg-panel text-fg')}>
            <span className="min-w-0">{status}</span>
            {statusTone === 'error' && canRetryLoad && <Button type="button" variant="secondary" icon={<RefreshCw size={13} />} loading={loading} onClick={() => void load()} className="shrink-0 self-start sm:self-auto">Retry loading</Button>}
          </div>
        )}


              <section data-ams-feature-slug="time-tracking-ledger" data-ams-slug="time-tracking-ledger" className="rounded-card border border-line bg-panel overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h2 className="text-sm font-semibold">Recent entries</h2>
              <p className="text-xs text-muted mt-1">{loading ? 'Loading…' : `${logs.length} entries`}</p>
            </div>
          </div>
          {loading ? (
            <div className="space-y-0" role="status" aria-label="Loading time entries">
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="grid grid-cols-[110px_minmax(220px,1fr)_120px_100px_110px_72px] items-center gap-4 border-b border-line px-4 py-3 last:border-b-0">
                  <Skeleton className="h-3 w-20" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-32 max-w-full" />
                    <Skeleton className="h-3 w-24 max-w-full" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20 rounded-badge" />
                  <Skeleton className="h-8 w-8 rounded-control" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="min-h-[160px] px-4 py-8 text-center">
              <Timer size={22} className="mx-auto text-muted" />
              <p className="mt-3 text-sm text-fg">No time entries yet</p>
              <p className="mt-1 text-xs text-muted">Add the first delivery time entry above.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="time-log-mobile-cards" role="list" aria-label="Time entry cards">
                {pagedLogs.map(log => (
                  <article key={log.id} role="listitem" data-ams-slug={'time-log-card-' + log.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] tabular-nums text-muted">{log.date}</p>
                        <h3 className="mt-1 break-words text-sm font-semibold text-fg">{log.projectName || 'General'}</h3>
                        <p className="mt-1 break-words text-xs leading-5 text-muted">{log.taskTitle || 'General activity'}</p>
                      </div>
                      <span className="shrink-0 rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-semibold tabular-nums text-fg">{formatMinutes(Number(log.durationMinutes || 0))}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted">Team member</p>
                        <div className="mt-1">{log.user ? <ProfileIdentity profile={{ name: log.user, contextLabel: 'Time entry', id: log.userId }} showRole={false} size="sm" /> : <span className="text-xs text-muted">—</span>}</div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted">Billing type</p>
                        <span className="mt-1 inline-flex rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-fg">{log.billable ? 'Billable' : 'Non-billable'}</span>
                      </div>
                    </div>
                    {(canDeleteAll || log.userId === getAdminSession()?.user?.id) && (
                      <div className="mt-3 flex justify-end">
                        <button type="button" onClick={() => void remove(log)} aria-label={'Delete time entry for ' + (log.user || 'team member') + ' on ' + log.date} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-danger/20 bg-danger/5 px-3 text-[11px] font-medium text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                          <Trash2 size={13} />Delete entry
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <div className="hidden min-[1280px]:block overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable time log register">
              <table className="ams-table w-full min-w-[760px] text-left">
                <thead className="bg-bg text-xs normal-case tracking-normal text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Project / Task</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pagedLogs.map(log => (
                    <tr key={log.id} className="hover:bg-panel-hover">
                      <td className="px-4 py-3 text-xs text-fg whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-fg">{log.projectName || 'General'}</div>
                        <div className="text-[11px] text-muted mt-0.5">{log.taskTitle || 'General activity'}</div>
                      </td>
                      <td className="px-4 py-3">{log.user ? <ProfileIdentity profile={{ name: log.user, contextLabel: 'Time entry', id: log.userId }} showRole={false} /> : <span className="text-xs text-muted">—</span>}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-fg">{formatMinutes(Number(log.durationMinutes || 0))}</td>
                      <td className="px-4 py-3"><span className="inline-flex px-2 py-1 rounded-badge border border-line text-[10px] text-fg">{log.billable ? 'Billable' : 'Non-billable'}</span></td>
                      <td className="px-4 py-3 text-right">
                        {(canDeleteAll || log.userId === getAdminSession()?.user?.id) && (
                          <button onClick={() => void remove(log)} className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-control text-muted hover:text-danger hover:bg-accent/10" title="Delete time entry">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              <AdminTablePagination total={logs.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="time entries" slug="time-tracking-pagination" />
            </>
          )}
        </section>

        <AdminMetricStrip slug="time-tracking-kpis"
        metrics={[
          {
            id: 'tracked-time',
            label: 'Tracked time',
            value: formatMinutes(totalMinutes),
            icon: <Timer size={15} />,
            toneClassName: 'text-accent-text'
          },
          {
            id: 'billable-time',
            label: 'Billable time',
            value: formatMinutes(billableMinutes),
            icon: <ReceiptText size={15} />,
            toneClassName: 'text-accent-text'
          },
          {
            id: 'entries',
            label: 'Entries',
            value: String(logs.length),
            icon: <CalendarDays size={15} />,
            toneClassName: 'text-muted'
          }
        ]}
      />



      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete time entry"
        description={deleteTarget ? `${deleteTarget.projectName || 'General'} · ${deleteTarget.taskTitle || 'General activity'} · ${formatMinutes(Number(deleteTarget.durationMinutes || 0))}. This entry will be removed from the time log.` : 'This entry will be removed from the time log.'}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) void confirmRemove(deleteTarget); }}
      />
    </AdminPageShell>
  );
};

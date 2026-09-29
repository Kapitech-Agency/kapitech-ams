import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, CalendarDays, Timer, ReceiptText } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getAdminSession, hasAdminPermission } from '../../lib/adminAuth';
import Button from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { AdminMetricStrip, AdminModuleHeader } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';


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
};

export const AdminTimeLogs: React.FC = () => {
  const canManage = hasAdminPermission('canManageProjects') || hasAdminPermission('canManageKanbanTasks');
  const canDeleteAll = hasAdminPermission('canManageProjects');
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('General');
  const [taskTitle, setTaskTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TimeLog | null>(null);

  const load = async () => {
    setLoading(true);
    const [logsRes, projectsRes] = await Promise.all([
      api.timeLogs.getAll(),
      api.projects.getAll()
    ]);
    if (logsRes.success && logsRes.data?.timeLogs) setLogs(logsRes.data.timeLogs);
    else setStatus(logsRes.error || 'Unable to load time logs.');
    if (projectsRes?.success && Array.isArray(projectsRes.data?.projects)) setProjects(projectsRes.data.projects);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const totalMinutes = useMemo(() => logs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0), [logs]);
  const billableMinutes = useMemo(() => logs.filter(log => log.billable).reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0), [logs]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    const project = projects.find(item => item.id === id);
    setProjectName(project?.name || 'General');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canManage) return;
    setSaving(true);
    setStatus(null);
    const res = await api.timeLogs.create({
      projectId,
      projectName: projectName || 'General',
      taskTitle,
      durationMinutes,
      billable,
      date,
      notes
    });
    if (res.success && res.data?.timeLog) {
      setLogs(current => [res.data!.timeLog, ...current]);
      setTaskTitle('');
      setNotes('');
      setStatus('Time entry saved.');
    } else {
      setStatus(res.error || 'Time entry could not be saved.');
    }
    setSaving(false);
  };

  const remove = async (log: TimeLog) => {
    if (!canManage || (!canDeleteAll && log.userId !== getAdminSession()?.user?.id)) return;
    setDeleteTarget(log);
  };

  const confirmRemove = async (log: TimeLog) => {
    const res = await api.timeLogs.delete(log.id);
    if (res.success) setLogs(current => current.filter(item => item.id !== log.id));
    else setStatus(res.error || 'Time entry could not be deleted.');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <AdminModuleHeader
        title="Time tracking"
        description="Record project time, billable hours, and activity notes in one consistent delivery workspace."
        actions={
          <>
            {canManage && (
              <Button
                type="button"
                variant="primary"
                icon={<Plus size={15} />}
                onClick={() => document.getElementById('time-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
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

      <AdminMetricStrip
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

        {canManage && (
          <form id="time-entry-form" onSubmit={submit} className="rounded-card border border-line bg-panel p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">New time entry</h2>
                <p className="text-xs text-muted mt-1">Keep project time accurate and traceable.</p>
              </div>
              <span className="hidden sm:inline-flex h-7 w-7 items-center justify-center rounded-control border border-line bg-bg text-accent-text" aria-hidden="true"><Plus size={15} /></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <label className="space-y-1.5">
                <span className="text-[11px] text-muted">Project</span>
                <CustomSelect
                  value={projectId}
                  onChange={handleProjectChange}
                  options={[{ value: "", label: "General" }, ...projects.map(project => ({ value: project.id, label: project.name }))]}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] text-muted">Task</span>
                <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task or activity" className="ams-control w-full" />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] text-muted">Duration (minutes)</span>
                <input type="number" min={1} max={1440} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="ams-control w-full" />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] text-muted">Date</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="ams-control w-full" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
              <label className="space-y-1.5">
                <span className="text-[11px] text-muted">Notes</span>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional context" className="ams-control w-full" />
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <label className="flex items-center gap-2 h-10 px-3 rounded-control border border-line bg-bg text-xs cursor-pointer">
                  <input type="checkbox" checked={billable} onChange={e => setBillable(e.target.checked)} className="accent-accent" />
                  Billable
                </label>
                <button type="submit" disabled={saving} aria-busy={saving || undefined} className="min-h-10 px-4 rounded-control bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-2">
                  {saving ? 'Saving…' : 'Add entry'}
                </button>
              </div>
            </div>
          </form>
        )}

        {status && <div className="rounded-card border border-line bg-panel px-4 py-3 text-xs text-fg">{status}</div>}

        <section className="rounded-card border border-line bg-panel overflow-hidden">
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
            <div className="overflow-x-auto">
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
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-panel-hover">
                      <td className="px-4 py-3 text-xs text-fg whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-fg">{log.projectName || 'General'}</div>
                        <div className="text-[11px] text-muted mt-0.5">{log.taskTitle || 'General activity'}</div>
                      </td>
                      <td className="px-4 py-3">{log.user ? <ProfileIdentity profile={{ name: log.user, role: 'Team member', division: 'Project Operations', id: log.userId }} showRole={false} /> : <span className="text-xs text-muted">—</span>}</td>
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
          )}
        </section>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete time entry"
        description={deleteTarget ? `${deleteTarget.projectName || 'General'} · ${deleteTarget.taskTitle || 'General activity'} · ${formatMinutes(Number(deleteTarget.durationMinutes || 0))}. This entry will be removed from the time log.` : 'This entry will be removed from the time log.'}
        confirmLabel="Delete"
        onConfirm={() => { if (deleteTarget) void confirmRemove(deleteTarget); }}
      />
    </div>
  );
};

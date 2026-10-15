import React, { useEffect, useMemo, useState } from 'react';
import { Timer, Square } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { Modal } from '../ui/Modal';
import { Drawer } from '../ui/Drawer';
import Button from '../ui/Button';

interface TimerProject {
  id: string;
  name: string;
  tasks?: Array<{ id: string; title: string }>;
}

interface ActiveTimer {
  userId: string;
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  startedAt: number;
  billable: boolean;
  notes?: string;
}

const STORAGE_KEY = 'kapitech_ams_active_timer_v1';
const TIMER_SYNC_EVENT = 'kapitech-ams-global-timer-sync';

function readTimer(userId?: string): ActiveTimer | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const timer = JSON.parse(raw) as ActiveTimer;
    if (!timer || !timer.projectId || !Number.isFinite(timer.startedAt)) return null;
    if (userId && timer.userId && timer.userId !== userId) return null;
    return timer;
  } catch {
    return null;
  }
}

function formatElapsed(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map((part) => String(part).padStart(2, '0')).join(':');
}

function localDateString() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/**
 * Global timer action. Active state survives route changes and reloads, while
 * stopped sessions are written through the same time-log API as manual entries.
 */
export const GlobalTimerControl: React.FC<{ userId?: string }> = ({ userId }) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => readTimer(userId));
  const [now, setNow] = useState(Date.now());
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [projects, setProjects] = useState<TimerProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [note, setNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setActiveTimer(readTimer(userId));
  }, [userId]);

  useEffect(() => {
    const syncTimer = (event: Event) => {
      const detail = (event as CustomEvent<ActiveTimer | null>).detail;
      if (!detail || (userId && detail.userId && detail.userId !== userId)) {
        setActiveTimer(null);
        return;
      }
      setActiveTimer(detail);
    };
    window.addEventListener(TIMER_SYNC_EVENT, syncTimer);
    return () => window.removeEventListener(TIMER_SYNC_EVENT, syncTimer);
  }, [userId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!startDialogOpen) return;
    let cancelled = false;
    setProjectsLoading(true);
    void api.projects.getAll()
      .then((response: any) => {
        if (cancelled) return;
        const rows = Array.isArray(response?.data?.projects) ? response.data.projects : [];
        setProjects(rows.filter((item: any) => item && typeof item.id === 'string' && typeof item.name === 'string'));
        if (!response?.success) setErrorMessage(response?.error || 'Project list could not be loaded.');
      })
      .catch((error: unknown) => {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Project list could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => { cancelled = true; };
  }, [startDialogOpen]);

  const selectedProject = projects.find((project) => project.id === projectId);
  const taskOptions = useMemo(
    () => Array.isArray(selectedProject?.tasks)
      ? selectedProject.tasks.filter((task) => task && typeof task.id === 'string' && typeof task.title === 'string')
      : [],
    [selectedProject]
  );
  const elapsedSeconds = activeTimer ? Math.max(0, Math.floor((now - activeTimer.startedAt) / 1000)) : 0;

  const persistTimer = (timer: ActiveTimer | null) => {
    try {
      if (timer) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Keep the in-memory timer usable if browser storage is unavailable.
    }
    setActiveTimer(timer);
    window.dispatchEvent(new CustomEvent<ActiveTimer | null>(TIMER_SYNC_EVENT, { detail: timer }));
  };

  const startTimer = () => {
    if (!projectId || !selectedProject) {
      setErrorMessage('Select a project before starting the timer.');
      return;
    }
    setErrorMessage('');
    persistTimer({
      userId: userId || '',
      projectId,
      projectName: selectedProject.name,
      taskId: taskId || undefined,
      taskTitle: taskOptions.find((task) => task.id === taskId)?.title,
      startedAt: Date.now(),
      billable: true,
      notes: note.trim(),
    });
    setStartDialogOpen(false);
    setTaskId('');
    setNote('');
  };

  const stopTimer = async () => {
    if (!activeTimer || saving) return;
    setSaving(true);
    setErrorMessage('');
    const durationMinutes = Math.max(1, Math.ceil((Date.now() - activeTimer.startedAt) / 60000));
    try {
      const response = await api.timeLogs.create({
        projectId: activeTimer.projectId,
        projectName: activeTimer.projectName,
        taskId: activeTimer.taskId || undefined,
        taskTitle: activeTimer.taskTitle || '',
        durationMinutes,
        billable: activeTimer.billable,
        date: localDateString(),
        notes: activeTimer.notes || 'Tracked with global timer.',
      });
      if (response?.success && response.data?.timeLog) {
        persistTimer(null);
        setNote('');
      } else {
        setErrorMessage(response?.error || 'Time entry could not be saved. The timer remains active; retry Stop to try again.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Time entry could not be saved. The timer remains active; retry Stop to try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (activeTimer) void stopTimer();
          else {
            setErrorMessage('');
            setProjectId('');
            setTaskId('');
            setStartDialogOpen(true);
          }
        }}
        disabled={saving}
        aria-label={activeTimer ? 'Stop timer and save time entry' : 'Start timer'}
        aria-pressed={Boolean(activeTimer)}
        data-ams-feature-slug="global-time-tracker"
        className={[
          'inline-flex h-8 items-center justify-center gap-2 rounded-control border px-2.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60',
          activeTimer
            ? 'border-accent/30 bg-accent/10 text-fg hover:bg-accent/15'
            : 'border-line bg-bg text-muted hover:border-accent/30 hover:text-fg',
        ].join(' ')}
        title={activeTimer ? 'Stop timer and save time entry' : 'Start a tracked work session'}
      >
        {activeTimer ? <Square size={12} fill="currentColor" aria-hidden="true" /> : <Timer size={14} aria-hidden="true" />}
        {activeTimer ? (
          <span className="tabular-nums">{saving ? 'Saving…' : formatElapsed(elapsedSeconds)}</span>
        ) : (
          <span className="hidden sm:inline">Start timer</span>
        )}
      </button>

      <Drawer
        open={startDialogOpen}
        onClose={() => setStartDialogOpen(false)}
        size="sm"
        title="Start work timer"
        description="Choose a project and optionally link this time entry to a task."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
            <Button type="button" variant="primary" onClick={startTimer} disabled={projectsLoading || !projectId}>Start timer</Button>
          </>
        )}
      >
        <div className="space-y-4" data-ams-slug="global-timer-start-form">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-fg">Project</span>
            <select
              value={projectId}
              onChange={(event) => { setProjectId(event.target.value); setTaskId(''); }}
              disabled={projectsLoading}
              className="h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
              required
            >
              <option value="">{projectsLoading ? 'Loading projects…' : 'Select a project'}</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-fg">Task (optional)</span>
            <select
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              disabled={!projectId || !taskOptions.length}
              className="h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="">No linked task</option>
              {taskOptions.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-fg">Note (optional)</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What are you working on?"
              maxLength={240}
              className="h-10 w-full rounded-control border border-line bg-bg px-3 text-xs text-fg outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>
          {errorMessage && <p className="text-xs leading-5 text-danger" role="alert">{errorMessage}</p>}
        </div>
      </Drawer>

      <Modal
        open={Boolean(errorMessage) && !startDialogOpen}
        onClose={() => setErrorMessage('')}
        size="sm"
        title="Timer action needs attention"
        description={errorMessage}
        footer={<Button type="button" variant="secondary" onClick={() => setErrorMessage('')}>Close</Button>}
      >
        <p className="text-xs text-muted">
          {activeTimer ? 'Your timer has not been cleared. The elapsed session is still available to save.' : 'Check the project selection or retry after the connection is restored.'}
        </p>
      </Modal>
    </>
  );
};

export default GlobalTimerControl;

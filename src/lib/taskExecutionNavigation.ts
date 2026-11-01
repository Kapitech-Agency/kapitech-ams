export type TaskExecutionLayout = 'board' | 'list' | 'projects' | 'blockers';

/** Legacy worksheet names resolve to supported views, without changing task scope. */
export const resolveTaskExecutionLayout = (value: string | null): TaskExecutionLayout => {
  if (value === 'task-lists') return 'projects';
  if (value === 'dependencies') return 'blockers';
  return value === 'list' || value === 'projects' || value === 'blockers' ? value : 'board';
};

export const buildTaskExecutionLayoutHref = (params: URLSearchParams, layout: TaskExecutionLayout): string => {
  const next = new URLSearchParams(params);
  next.set('layout', layout);
  return '/admin/tasks?' + next.toString();
};

export type ProjectDeadlineFilter = 'all' | 'overdue' | 'next-7-days' | 'days-8-30' | 'no-deadline';

export interface ProjectDeadlineRecord {
  targetEndDate?: string | null;
  status?: string | null;
}

const parseLocalDateOnly = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const candidate = value.trim().slice(0, 10);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate);
  if (!parts) return null;
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  return candidate;
};

export const getLocalDateOnly = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

export const shiftLocalDateOnly = (value: string, dayOffset: number): string | null => {
  const validDate = parseLocalDateOnly(value);
  if (!validDate || !Number.isInteger(dayOffset)) return null;
  const [year, month, day] = validDate.split('-').map(Number);
  const shifted = new Date(year, month - 1, day, 12);
  shifted.setDate(shifted.getDate() + dayOffset);
  return getLocalDateOnly(shifted);
};

export const matchesProjectDeadlineFilter = (
  project: ProjectDeadlineRecord,
  filter: ProjectDeadlineFilter,
  today: string = getLocalDateOnly()
): boolean => {
  if (filter === 'all') return true;
  const deadline = parseLocalDateOnly(project.targetEndDate);
  if (filter === 'no-deadline') return deadline === null;
  if (!deadline || project.status === 'completed') return false;
  const currentDate = parseLocalDateOnly(today);
  if (!currentDate) return false;
  if (filter === 'overdue') return deadline < currentDate;
  const next7Days = shiftLocalDateOnly(currentDate, 7);
  const next30Days = shiftLocalDateOnly(currentDate, 30);
  if (!next7Days || !next30Days) return false;
  if (filter === 'next-7-days') return deadline >= currentDate && deadline <= next7Days;
  return deadline > next7Days && deadline <= next30Days;
};

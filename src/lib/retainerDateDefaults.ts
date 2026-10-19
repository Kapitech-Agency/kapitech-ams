const parseRetainerDateOnly = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  return date;
};

export const getRetainerRenewalDays = (value: string, now: Date = new Date()): number | null => {
  const renewal = parseRetainerDateOnly(value);
  if (!renewal || Number.isNaN(now.getTime())) return null;

  const renewalDay = Date.UTC(renewal.getFullYear(), renewal.getMonth(), renewal.getDate());
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((renewalDay - todayDay) / 86400000);
};

export const formatRetainerRenewalDate = (value: string): string => {
  const date = parseRetainerDateOnly(value);
  return date
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    : 'Not set';
};

export const getDefaultRetainerRenewalDate = (now: Date = new Date()): string => {
  const renewal = new Date(now);
  renewal.setMonth(renewal.getMonth() + 1);

  const year = renewal.getFullYear();
  const month = String(renewal.getMonth() + 1).padStart(2, '0');
  const day = String(renewal.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

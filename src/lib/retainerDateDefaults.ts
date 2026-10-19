export const getDefaultRetainerRenewalDate = (now: Date = new Date()): string => {
  const renewal = new Date(now);
  renewal.setMonth(renewal.getMonth() + 1);

  const year = renewal.getFullYear();
  const month = String(renewal.getMonth() + 1).padStart(2, '0');
  const day = String(renewal.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

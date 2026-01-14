import { format, formatDistanceToNow, differenceInMinutes, differenceInMonths, differenceInDays, parseISO } from 'date-fns';

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const calculateDuration = (start: string | Date, end: string | Date): number => {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMinutes(endDate, startDate);
};

export const calculateAge = (birthDate: string): { months: number; days: number; text: string } => {
  const birth = parseISO(birthDate);
  const now = new Date();
  const months = differenceInMonths(now, birth);
  const days = differenceInDays(now, birth) % 30;
  
  let text = '';
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    text = remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}y`;
  } else if (months > 0) {
    text = `${months}m ${days}d`;
  } else {
    text = `${days}d`;
  }
  
  return { months, days, text };
};

export const getToday = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const getTodayISO = (): string => {
  return new Date().toISOString();
};

export const isToday = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

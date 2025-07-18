import { formatInTimeZone } from 'date-fns-tz';

export const validateDateRange = (start: Date, end: Date) => {
  const now = new Date();
  if (start > end) throw new Error("Start date must be before end date");
  if (end > now) throw new Error("End date cannot be in the future");
  return { 
    start: formatInTimeZone(start, 'UTC', 'yyyy-MM-dd'),
    end: formatInTimeZone(end, 'UTC', 'yyyy-MM-dd')
  };
};

export const formatDateForTimezone = (date: Date, timezone: string = 'UTC') => {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd HH:mm:ss');
};

export const validateDateInput = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }
  return date;
}; 
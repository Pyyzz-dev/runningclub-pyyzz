import {
  formatDate as formatDateFns,
  formatDateTime as formatDateTimeFns,
  formatTime as formatTimeFns,
  fromDatetimeLocal,
  parseStableDate,
  toDatetimeLocal,
  toIsoDateTime,
} from "@/lib/format";

export { fromDatetimeLocal, toDatetimeLocal, toIsoDateTime };

export function formatDateTime(date: string | Date): string {
  return formatDateTimeFns(date);
}

export function formatDate(date: string | Date): string {
  return formatDateFns(date);
}

export function formatTime(date: string | Date): string {
  return formatTimeFns(date);
}

/** vi-VN display with full date and time (including seconds) in Vietnam timezone. */
export function formatDateTimeLocale(date: string | Date): string {
  return formatDateTime(date);
}

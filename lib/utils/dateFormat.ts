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

/** vi-VN locale display with full date and time (including seconds). */
export function formatDateTimeLocale(date: string | Date): string {
  return parseStableDate(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

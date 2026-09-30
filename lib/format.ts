import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  fromVietnamDatetimeLocal,
  toVietnamDatetimeLocal,
  VIETNAM_TIMEZONE,
} from "@/lib/utils/timezone";

const VIETNAM_TZ = VIETNAM_TIMEZONE;

function formatWithTimeZoneParts(
  date: string | Date,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TZ,
    ...options,
  }).formatToParts(parseStableDate(date));
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

/** YYYY-MM-DD in Vietnam timezone (for date inputs). */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const parsed = date instanceof Date ? date : parseStableDate(date);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

/** Store a calendar date in Vietnam time (UTC+7, no DST). */
export function fromDateInputValue(value: string, endOfDay = false): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return endOfDay
      ? `${trimmed}T23:59:59.999+07:00`
      : `${trimmed}T00:00:00.000+07:00`;
  }
  return toIsoDateTime(trimmed);
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function parseStableDate(date: string | Date): Date {
  if (date instanceof Date) return date;

  const trimmed = date.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(trimmed);
}

/** `datetime-local` input value from ISO / DB string (giờ Việt Nam). */
export function toDatetimeLocal(iso: string | null | undefined): string {
  return toVietnamDatetimeLocal(iso);
}

/** ISO UTC để lưu DB, hiểu `datetime-local` là giờ Việt Nam. */
export function fromDatetimeLocal(value: string): string {
  return fromVietnamDatetimeLocal(value);
}

export function toIsoDateTime(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000+07:00`;
  }
  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed) &&
    !/[zZ]$/.test(trimmed) &&
    !/[+-]\d{2}:\d{2}$/.test(trimmed)
  ) {
    return fromVietnamDatetimeLocal(trimmed);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed) && trimmed.endsWith("Z")) {
    return trimmed;
  }
  return new Date(trimmed).toISOString();
}

/** Extract year without timezone drift (for grouping / timelines). */
export function getYearFromDateString(date: string): number {
  const trimmed = date.trim();
  const match = /^(\d{4})/.exec(trimmed);
  if (match) return Number(match[1]);
  return parseStableDate(trimmed).getFullYear();
}

export function formatDate(date: string | Date | null, pattern = "dd/MM/yyyy"): string {
  if (!date) return "";
  if (pattern === "dd/MM/yyyy") {
    const parts = formatWithTimeZoneParts(date, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return `${getPart(parts, "day")}/${getPart(parts, "month")}/${getPart(parts, "year")}`;
  }
  return format(parseStableDate(date), pattern, { locale: vi });
}

export function formatLongDate(date: string | Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseStableDate(date));
}

export function compareEventDates(a: string, b: string): number {
  return parseStableDate(a).getTime() - parseStableDate(b).getTime();
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "";
  const parts = formatWithTimeZoneParts(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${getPart(parts, "day")}/${getPart(parts, "month")}/${getPart(parts, "year")} ${getPart(parts, "hour")}:${getPart(parts, "minute")}:${getPart(parts, "second")}`;
}

export function formatTime(date: string | Date | null): string {
  if (!date) return "";
  const parts = formatWithTimeZoneParts(date, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${getPart(parts, "hour")}:${getPart(parts, "minute")}:${getPart(parts, "second")}`;
}

export function formatPublishedAt(date: string | Date | null): string {
  if (!date) return "";
  const parts = formatWithTimeZoneParts(date, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${getPart(parts, "day")} ${getPart(parts, "month")} ${getPart(parts, "year")}, ${getPart(parts, "hour")}:${getPart(parts, "minute")}`;
}

export function truncateText(text: string, maxLength = 150): string {
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  if (stripped.length <= maxLength) return stripped;
  return `${stripped.slice(0, maxLength).trim()}...`;
}

export function isWithinDays(date: string | Date | null, days: number): boolean {
  if (!date) return false;
  const diff = Date.now() - new Date(date).getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

export function getWeekPeriod(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

export function getMonthPeriod(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export function generateICS({
  title,
  description,
  location,
  startTime,
  endTime,
}: {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime?: string | null;
}): string {
  const formatICSDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const start = formatICSDate(new Date(startTime));
  const end = formatICSDate(new Date(endTime ?? startTime));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cau lac bo Chay bo CMC Global//VN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    description ? `DESCRIPTION:${description.replace(/\n/g, "\\n")}` : "",
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

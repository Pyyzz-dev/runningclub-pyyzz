import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return "";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

export function formatDate(date: string | Date | null, pattern = "dd/MM/yyyy"): string {
  if (!date) return "";
  return format(new Date(date), pattern, { locale: vi });
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi });
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

/**
 * Múi giờ Việt Nam (GMT+7, không DST).
 * Dùng khi tạo/lưu/hiển thị lịch tập để server UTC và client VN không lệch ngày.
 */
export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
export const VIETNAM_OFFSET_HOURS = 7;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

export type VietnamDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}

/**
 * Tạo Date từ lịch + giờ Việt Nam, lưu được dưới dạng UTC.
 */
export function createVietnamDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): Date {
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}+07:00`;
  return new Date(iso);
}

export function getVietnamDateParts(date: Date | string): VietnamDateParts {
  const parsed = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: VIETNAM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(parsed);

  return {
    year: Number(getPart(parts, "year")),
    month: Number(getPart(parts, "month")),
    day: Number(getPart(parts, "day")),
    hour: Number(getPart(parts, "hour")),
    minute: Number(getPart(parts, "minute")),
    second: Number(getPart(parts, "second")),
  };
}

/** YYYY-MM-DD theo giờ Việt Nam */
export function formatVietnamDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const { year, month, day } = getVietnamDateParts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** YYYY-MM-DD HH:mm theo giờ Việt Nam */
export function formatVietnamDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const { year, month, day, hour, minute } = getVietnamDateParts(date);
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

/** Giá trị `datetime-local` (YYYY-MM-DDTHH:mm) theo giờ Việt Nam */
export function toVietnamDatetimeLocal(date: Date | string | null | undefined): string {
  if (!date) return "";
  const { year, month, day, hour, minute } = getVietnamDateParts(date);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** Đọc `datetime-local` như giờ Việt Nam, trả ISO UTC để lưu DB */
export function fromVietnamDatetimeLocal(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);
  if (!match) {
    return new Date(trimmed).toISOString();
  }

  const [, year, month, day, hour, minute, second] = match;
  return createVietnamDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? 0)
  ).toISOString();
}

export function getTodayVietnam(): string {
  return formatVietnamDate(new Date());
}

export function vietnamDayBounds(year: number, month: number, day: number): {
  start: Date;
  end: Date;
} {
  return {
    start: createVietnamDate(year, month, day, 0, 0, 0, 0),
    end: createVietnamDate(year, month, day, 23, 59, 59, 999),
  };
}

export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  days: number
): { year: number; month: number; day: number } {
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

/**
 * Thứ 4 gần nhất theo lịch Việt Nam (tuần này, hoặc tuần sau nếu đã qua giờ tập).
 */
export function getNextWednesday(
  fromDate: Date = new Date(),
  sessionHour = 18,
  sessionMinute = 0
): { year: number; month: number; day: number } {
  const parts = getVietnamDateParts(fromDate);
  const weekday = createVietnamDate(parts.year, parts.month, parts.day, 12, 0).getUTCDay();
  let daysUntilWednesday = (3 - weekday + 7) % 7;

  const todaySession = createVietnamDate(
    parts.year,
    parts.month,
    parts.day,
    sessionHour,
    sessionMinute
  );
  if (daysUntilWednesday === 0 && fromDate.getTime() >= todaySession.getTime()) {
    daysUntilWednesday = 7;
  }

  return addCalendarDays(parts.year, parts.month, parts.day, daysUntilWednesday);
}

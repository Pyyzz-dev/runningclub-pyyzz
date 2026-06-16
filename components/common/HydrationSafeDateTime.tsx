"use client";

import { formatDateTime } from "@/lib/format";

interface HydrationSafeDateTimeProps {
  date: string | Date | null;
  className?: string;
}

/** Renders a stable date string after mount to avoid SSR/client timezone drift. */
export function HydrationSafeDateTime({ date, className }: HydrationSafeDateTimeProps) {
  if (!date) return null;

  return (
    <span className={className} suppressHydrationWarning>
      {formatDateTime(date)}
    </span>
  );
}

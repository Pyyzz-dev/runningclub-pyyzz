"use client";

import { YearTimeline } from "@/components/history/YearTimeline";
import { formatDateTime, getYearFromDateString } from "@/lib/format";
import type { ClubHistory } from "@/lib/supabase/types";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

const SCROLL_HEADER_OFFSET = 100;

interface HistoryTimelineProps {
  items: ClubHistory[];
  className?: string;
}

function groupItemsByYear(items: ClubHistory[]): Map<number, ClubHistory[]> {
  const sorted = [...items].sort(
    (a, b) =>
      parseStableTimestamp(a.event_date) - parseStableTimestamp(b.event_date)
  );

  const grouped = new Map<number, ClubHistory[]>();

  for (const item of sorted) {
    const year = getYearFromDateString(item.event_date);
    const yearItems = grouped.get(year) ?? [];
    yearItems.push(item);
    grouped.set(year, yearItems);
  }

  return grouped;
}

function parseStableTimestamp(eventDate: string): number {
  const trimmed = eventDate.trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
  }
  return new Date(trimmed).getTime();
}

export function HistoryTimeline({ items, className }: HistoryTimelineProps) {
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const itemsByYear = useMemo(() => groupItemsByYear(items), [items]);
  const years = useMemo(
    () => Array.from(itemsByYear.keys()).sort((a, b) => a - b),
    [itemsByYear]
  );

  const scrollToYear = useCallback((year: number) => {
    const element = yearRefs.current[year];
    if (!element) return;

    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - SCROLL_HEADER_OFFSET;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
    setActiveYear(year);
  }, []);

  if (items.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có dữ liệu lịch sử.
      </p>
    );
  }

  return (
    <div className={cn(className)}>
      <YearTimeline years={years} onYearClick={scrollToYear} activeYear={activeYear} />

      <div className="relative">
        <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-px" />

        <div className="space-y-12">
          {years.map((year) => {
            const yearItems = itemsByYear.get(year) ?? [];

            return (
              <div
                key={year}
                ref={(el) => {
                  yearRefs.current[year] = el;
                }}
                className="scroll-mt-24"
              >
                <h2 className="mb-6 font-display text-2xl font-bold text-blue-600 md:text-3xl">
                  {year}
                </h2>

                <div className="space-y-8">
                  {yearItems.map((item, index) => {
                    const isEven = index % 2 === 0;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "relative flex flex-col gap-4 md:flex-row md:items-start",
                          isEven && "md:flex-row-reverse"
                        )}
                      >
                        <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:left-1/2" />

                        <div className="hidden flex-1 md:block" />

                        <div
                          className={cn(
                            "ml-10 flex-1 rounded-lg border bg-card p-6 shadow-sm md:ml-0",
                            isEven && "md:text-right"
                          )}
                        >
                          <time className="text-sm font-medium text-primary">
                            {formatDateTime(item.event_date)}
                          </time>
                          <h3 className="mt-1 font-display text-lg font-semibold">
                            {item.title}
                          </h3>
                          <div
                            className="prose prose-sm mt-2 max-w-none text-muted-foreground dark:prose-invert [&_img]:max-w-full [&_img]:rounded-md"
                            dangerouslySetInnerHTML={{
                              __html: cleanHtmlContent(item.content),
                            }}
                          />
                          {item.image_url && (
                            <div
                              className={cn(
                                "relative mt-4 aspect-video overflow-hidden rounded-md",
                                isEven && "md:ml-auto"
                              )}
                            >
                              <Image
                                src={item.image_url}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

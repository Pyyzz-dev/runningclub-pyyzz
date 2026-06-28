"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compareEventDates, formatDate, getYearFromDateString } from "@/lib/format";
import { cn } from "@/lib/utils";

export type HistoryTimelineEvent = {
  id: string;
  title: string;
  event_date: string;
};

interface YearGroup {
  year: number;
  events: HistoryTimelineEvent[];
}

interface HistoryTimelineProps {
  items: HistoryTimelineEvent[];
  className?: string;
}

const SCROLL_OFFSET = 96;
const HIGHLIGHT_MS = 3000;

function groupByYear(items: HistoryTimelineEvent[]): YearGroup[] {
  const grouped = new Map<number, HistoryTimelineEvent[]>();

  for (const item of items) {
    const year = getYearFromDateString(item.event_date);
    const yearItems = grouped.get(year) ?? [];
    yearItems.push(item);
    grouped.set(year, yearItems);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, events]) => ({
      year,
      events: [...events].sort((a, b) => compareEventDates(a.event_date, b.event_date)),
    }));
}

function YearSearchForm({
  searchYear,
  onSearchYearChange,
  onSubmit,
  className,
}: {
  searchYear: string;
  onSearchYearChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}) {
  return (
    <form onSubmit={onSubmit} className={cn("flex gap-2", className)}>
      <Input
        type="number"
        inputMode="numeric"
        placeholder="Nhập năm (VD: 2026)"
        value={searchYear}
        onChange={(e) => onSearchYearChange(e.target.value)}
        className="max-w-xs"
        aria-label="Tìm kiếm theo năm"
      />
      <Button type="submit">Tìm kiếm</Button>
    </form>
  );
}

function EventCard({
  event,
  isDimmed,
  isHighlighted,
  className,
}: {
  event: HistoryTimelineEvent;
  isDimmed: boolean;
  isHighlighted: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/history/${event.id}`}
      className={cn(
        "block rounded-lg border bg-card p-3 shadow-sm transition-all duration-300",
        "hover:border-blue-400 hover:shadow-md",
        isDimmed && "scale-95 opacity-40",
        isHighlighted && "z-10 scale-110 border-blue-500 shadow-lg",
        className
      )}
    >
      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
        {formatDate(event.event_date)}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground hover:text-blue-600 hover:underline">
        {event.title}
      </p>
    </Link>
  );
}

function DesktopYearRow({
  year,
  events,
  isSelected,
  yearRef,
  hoveredEventId,
  onHover,
}: {
  year: number;
  events: HistoryTimelineEvent[];
  isSelected: boolean;
  yearRef: (el: HTMLDivElement | null) => void;
  hoveredEventId: string | null;
  onHover: (id: string | null) => void;
}) {
  return (
    <div
      ref={yearRef}
      className={cn(
        "scroll-mt-24 rounded-2xl p-4 transition-all duration-500",
        isSelected && "animate-pulse bg-blue-50/60 ring-2 ring-blue-500"
      )}
    >
      <div className="mb-6 flex items-center gap-4">
        <h2
          className={cn(
            "font-display text-3xl font-bold transition-colors",
            isSelected ? "text-blue-700" : "text-blue-600"
          )}
        >
          {year}
        </h2>
        <div className="h-0.5 flex-1 bg-border" />
      </div>

      <div className="relative min-h-[168px] py-4">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-border" />

        <div className="relative flex min-h-[168px] justify-between gap-2">
          {events.map((event, index) => {
            const isTop = index % 2 === 0;
            const isDimmed = Boolean(hoveredEventId && hoveredEventId !== event.id);
            const isHighlighted = hoveredEventId === event.id;

            return (
              <div
                key={event.id}
                className="relative min-w-0 flex-1"
                onMouseEnter={() => onHover(event.id)}
                onMouseLeave={() => onHover(null)}
              >
                <div className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-background" />

                <div
                  className={cn(
                    "absolute left-0 right-0 px-1",
                    isTop ? "bottom-[calc(50%+0.625rem)]" : "top-[calc(50%+0.625rem)]"
                  )}
                >
                  <EventCard
                    event={event}
                    isDimmed={isDimmed}
                    isHighlighted={isHighlighted}
                    className="text-center"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileYearRow({
  year,
  events,
  isSelected,
  yearRef,
}: {
  year: number;
  events: HistoryTimelineEvent[];
  isSelected: boolean;
  yearRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={yearRef}
      className={cn(
        "scroll-mt-24 border-l-4 border-blue-200 pb-8 pl-6 transition-all duration-500",
        isSelected && "animate-pulse rounded-lg border-blue-600 bg-blue-50/60 p-4 ring-2 ring-blue-500"
      )}
    >
      <h2 className="mb-4 font-display text-2xl font-bold text-blue-600">{year}</h2>

      <div className="space-y-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/history/${event.id}`}
            className={cn(
              "block rounded-lg border bg-card p-3 shadow-sm transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md",
              isSelected && "border-blue-500"
            )}
          >
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatDate(event.event_date)}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground hover:text-blue-600 hover:underline">
              {event.title}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function HistoryTimeline({ items, className }: HistoryTimelineProps) {
  const [searchYear, setSearchYear] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const data = useMemo(() => groupByYear(items), [items]);

  const scrollToYear = useCallback((year: number) => {
    const target = yearRefs.current[year];
    if (!target) return false;

    const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
    setSelectedYear(year);
    window.setTimeout(() => setSelectedYear(null), HIGHLIGHT_MS);
    return true;
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const year = Number.parseInt(searchYear, 10);
    if (!Number.isFinite(year)) return;
    scrollToYear(year);
  };

  if (items.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có dữ liệu lịch sử.
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="mb-6 md:mb-8 md:flex md:justify-end">
        <YearSearchForm
          searchYear={searchYear}
          onSearchYearChange={setSearchYear}
          onSubmit={handleSearch}
          className="w-full md:w-auto"
        />
      </div>

      {/* Mobile: vertical timeline */}
      <div className="space-y-8 md:hidden">
        {data.map(({ year, events }) => (
          <MobileYearRow
            key={year}
            year={year}
            events={events}
            isSelected={selectedYear === year}
            yearRef={(el) => {
              yearRefs.current[year] = el;
            }}
          />
        ))}
      </div>

      {/* Desktop: horizontal timeline per year */}
      <div className="hidden space-y-12 md:block">
        {data.map(({ year, events }) => (
          <DesktopYearRow
            key={year}
            year={year}
            events={events}
            isSelected={selectedYear === year}
            yearRef={(el) => {
              yearRefs.current[year] = el;
            }}
            hoveredEventId={hoveredEventId}
            onHover={setHoveredEventId}
          />
        ))}
      </div>
    </div>
  );
}

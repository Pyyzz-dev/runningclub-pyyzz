"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
const EVENTS_PER_BATCH = 4;

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
      <p className="mt-1 text-sm font-medium leading-snug text-foreground hover:text-blue-600 hover:underline">
        {event.title}
      </p>
    </Link>
  );
}

function YearPager({
  page,
  totalPages,
  onPrev,
  onNext,
  className,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", className)}>
      <p className="text-xs font-medium text-muted-foreground">
        Trang {page} / {totalPages}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {hasPrev ? (
          <Button type="button" variant="outline" size="sm" onClick={onPrev} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
        ) : null}
        {hasNext ? (
          <Button type="button" variant="outline" size="sm" onClick={onNext} className="gap-1">
            Xem tiếp
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function YearSection({
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
  const [pageIndex, setPageIndex] = useState(0);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_BATCH));
  const hasPager = events.length > EVENTS_PER_BATCH;
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageEvents = events.slice(
    safePageIndex * EVENTS_PER_BATCH,
    safePageIndex * EVENTS_PER_BATCH + EVENTS_PER_BATCH
  );
  const page = safePageIndex + 1;
  const justifyClass =
    pageEvents.length < EVENTS_PER_BATCH ? "justify-start" : "justify-between";

  const showNext = () => {
    setPageIndex((current) => Math.min(current + 1, totalPages - 1));
  };

  const showPrev = () => {
    setPageIndex((current) => Math.max(current - 1, 0));
  };

  return (
    <div
      ref={yearRef}
      className={cn(
        "scroll-mt-24 rounded-2xl transition-all duration-500",
        isSelected && "animate-pulse bg-blue-50/60 p-4 ring-2 ring-blue-500"
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

      <div className="space-y-4 border-l-4 border-blue-200 pl-6 md:hidden">
        {pageEvents.map((event) => (
          <Link
            key={event.id}
            href={`/history/${event.id}`}
            className="block rounded-lg border bg-card p-3 shadow-sm transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
          >
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatDate(event.event_date)}
            </p>
            <p className="mt-1 text-sm font-medium leading-5 text-foreground hover:text-blue-600 hover:underline">
              {event.title}
            </p>
          </Link>
        ))}
      </div>

      {hasPager ? (
        <YearPager
          page={page}
          totalPages={totalPages}
          onPrev={showPrev}
          onNext={showNext}
          className="mt-6 md:hidden"
        />
      ) : null}

      <div className="relative hidden h-80 overflow-x-auto overflow-y-hidden md:block">
        <div className={cn("relative flex h-full min-w-full items-center gap-8", justifyClass)}>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-0.5 -translate-y-1/2 bg-border" />
          {pageEvents.map((event, index) => {
            const isTop = index % 2 === 0;
            const isDimmed = Boolean(hoveredEventId && hoveredEventId !== event.id);
            const isHighlighted = hoveredEventId === event.id;

            return (
              <div
                key={event.id}
                className="relative h-full w-[220px] shrink-0"
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <div className={cn("absolute inset-x-0", isTop ? "bottom-1/2 mb-6" : "top-1/2 mt-6")}>
                  <EventCard
                    event={event}
                    isDimmed={isDimmed}
                    isHighlighted={isHighlighted}
                    className="text-center"
                  />
                </div>
                <div className="absolute left-1/2 top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500 bg-background" />
              </div>
            );
          })}
          {hasPager ? (
            <div className="z-10 flex h-full w-[200px] shrink-0 items-center justify-center">
              <div className="bg-background px-3">
                <YearPager
                  page={page}
                  totalPages={totalPages}
                  onPrev={showPrev}
                  onNext={showNext}
                  className="rounded-lg border bg-card p-3 shadow-sm"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HistoryTimeline({ items, className }: HistoryTimelineProps) {
  const [searchYear, setSearchYear] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
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

      <div className="space-y-12">
        {data.map(({ year, events }) => (
          <YearSection
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
    </div>
  );
}

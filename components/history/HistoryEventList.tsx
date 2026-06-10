import { TimelineEvent } from "@/components/history/TimelineEvent";
import { compareEventDates, getYearFromDateString } from "@/lib/format";
import type { ClubHistory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type HistoryListItem = Pick<ClubHistory, "id" | "title" | "event_date">;

interface HistoryEventListProps {
  items: HistoryListItem[];
  className?: string;
}

function groupByYear(items: HistoryListItem[]): Map<number, HistoryListItem[]> {
  const grouped = new Map<number, HistoryListItem[]>();

  for (const item of items) {
    const year = getYearFromDateString(item.event_date);
    const yearItems = grouped.get(year) ?? [];
    yearItems.push(item);
    grouped.set(year, yearItems);
  }

  for (const [year, yearItems] of grouped) {
    yearItems.sort((a, b) => compareEventDates(a.event_date, b.event_date));
    grouped.set(year, yearItems);
  }

  return grouped;
}

export function HistoryEventList({ items, className }: HistoryEventListProps) {
  if (items.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có dữ liệu lịch sử.
      </p>
    );
  }

  const groupedByYear = groupByYear(items);
  const sortedYears = Array.from(groupedByYear.keys()).sort((a, b) => b - a);

  return (
    <div className={cn("space-y-12", className)}>
      {sortedYears.map((year) => {
        const yearItems = groupedByYear.get(year) ?? [];

        return (
          <section key={year} className="mb-4">
            <div className="mb-8 text-center">
              <h2 className="inline-block border-b-4 border-blue-600 pb-2 font-display text-3xl font-bold text-blue-600 md:text-4xl">
                {year}
              </h2>
            </div>

            <div className="relative">
              <div
                className="absolute left-4 top-0 h-full w-0.5 bg-blue-200 md:left-1/2 md:-translate-x-px"
                aria-hidden
              />

              <div className="space-y-8">
                {yearItems.map((event, index) => (
                  <TimelineEvent key={event.id} event={event} index={index} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

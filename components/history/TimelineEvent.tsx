import { formatDate } from "@/lib/format";
import type { ClubHistory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type TimelineEventData = Pick<ClubHistory, "id" | "title" | "event_date">;

interface TimelineEventProps {
  event: TimelineEventData;
  index: number;
}

export function TimelineEvent({ event, index }: TimelineEventProps) {
  const isEven = index % 2 === 0;

  return (
    <div
      className={cn(
        "timeline-event relative flex flex-col md:flex-row md:items-start",
        isEven ? "md:flex-row-reverse" : ""
      )}
    >
      <div className="absolute left-4 top-4 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-blue-600 bg-background md:left-1/2" />

      <div className="hidden flex-1 md:block" aria-hidden />

      <div
        className={cn(
          "timeline-event-content ml-10 w-[calc(100%-2.5rem)] md:ml-0 md:w-5/12",
          isEven ? "md:text-right" : "md:text-left"
        )}
      >
        <div className="rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
          <time className="text-sm font-medium text-muted-foreground" dateTime={event.event_date}>
            {formatDate(event.event_date, "dd/MM/yyyy")}
          </time>
          <Link
            href={`/history/${event.id}`}
            className={cn(
              "mt-1 block font-display text-base font-semibold text-foreground transition-colors hover:text-blue-600 hover:underline md:text-lg",
              isEven && "md:text-right"
            )}
          >
            {event.title}
          </Link>
        </div>
      </div>
    </div>
  );
}

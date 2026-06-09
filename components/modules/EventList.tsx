"use client";

import { EventCard } from "@/components/cards/EventCard";
import type { Event } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface EventListProps {
  events: Event[];
  className?: string;
}

export function EventList({ events, className }: EventListProps) {
  if (events.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có sự kiện sắp tới.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

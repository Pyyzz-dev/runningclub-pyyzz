"use client";

import { EventCard } from "@/components/cards/EventCard";
import type { Event } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EventListProps {
  events: Event[];
  className?: string;
  userId?: string | null;
  joinedMap?: Record<string, boolean>;
  enableParticipation?: boolean;
}

export function EventList({
  events,
  className,
  userId = null,
  joinedMap = {},
  enableParticipation = false,
}: EventListProps) {
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

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
      {events.map((event) => {
        const participantCount = localCounts[event.id] ?? event.participant_count ?? 0;

        return (
          <EventCard
            key={event.id}
            event={{ ...event, participant_count: participantCount }}
            userId={userId}
            isJoined={joinedMap[event.id] ?? false}
            enableParticipation={enableParticipation}
            loginRedirect="/events"
            onParticipationChange={(eventId, _joined, count) => {
              setLocalCounts((prev) => ({ ...prev, [eventId]: count }));
            }}
          />
        );
      })}
    </div>
  );
}

"use client";

import { EventParticipationActions } from "@/components/events/EventParticipationActions";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

interface EventDetailParticipationSectionProps {
  eventId: string;
  userId: string | null;
  initialJoined: boolean;
  canJoin: boolean;
  closedMessage?: string;
  initialParticipantCount: number;
}

export function EventDetailParticipationSection({
  eventId,
  userId,
  initialJoined,
  canJoin,
  closedMessage,
  initialParticipantCount,
}: EventDetailParticipationSectionProps) {
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);

  useEffect(() => {
    setParticipantCount(initialParticipantCount);
  }, [initialParticipantCount]);

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Users className="h-5 w-5" />
        <span>
          {participantCount} thành viên đã tham gia
        </span>
      </div>
      <EventParticipationActions
        eventId={eventId}
        userId={userId}
        initialJoined={initialJoined}
        canJoin={canJoin}
        closedMessage={closedMessage}
        loginRedirect={`/events/${eventId}`}
        initialParticipantCount={participantCount}
        onParticipantCountChange={setParticipantCount}
      />
    </div>
  );
}

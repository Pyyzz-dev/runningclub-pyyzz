import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { Event } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Calendar, ExternalLink, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const isUpcoming = new Date(event.event_date) >= new Date();
  const registrationOpen =
    !event.registration_deadline ||
    new Date(event.registration_deadline) >= new Date();
  const participantCount = event.participant_count ?? 0;

  return (
    <Card className={cn("flex flex-col overflow-hidden", className)}>
      <div className="relative aspect-video w-full bg-muted">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chưa có ảnh
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{event.name}</CardTitle>
          {isUpcoming ? (
            <Badge variant="default">Sắp diễn ra</Badge>
          ) : (
            <Badge variant="secondary">Đã kết thúc</Badge>
          )}
        </div>
        {event.description && (
          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formatDate(event.event_date, "dd/MM/yyyy")}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <span>{participantCount} thành viên đã đăng ký</span>
        </div>

        {event.registration_deadline && (
          <p className="text-xs text-muted-foreground">
            Hạn đăng ký: {formatDate(event.registration_deadline, "dd/MM/yyyy")}
            {!registrationOpen && " (đã hết hạn)"}
          </p>
        )}
      </CardContent>

      {event.event_link && registrationOpen && isUpcoming && (
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={event.event_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Đăng ký
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

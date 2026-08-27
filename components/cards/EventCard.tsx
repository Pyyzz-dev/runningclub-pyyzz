"use client";

import { joinEvent, leaveEvent } from "@/app/actions/eventParticipantActions";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EventCardProps {
  event: Event;
  className?: string;
  userId?: string | null;
  isJoined?: boolean;
  enableParticipation?: boolean;
  loginRedirect?: string;
  onParticipationChange?: (
    eventId: string,
    joined: boolean,
    participantCount: number
  ) => void;
}

export function EventCard({
  event,
  className,
  userId = null,
  isJoined = false,
  enableParticipation = false,
  loginRedirect = "/events",
  onParticipationChange,
}: EventCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(isJoined);
  const [participantCount, setParticipantCount] = useState(event.participant_count ?? 0);

  const isUpcoming = new Date(event.event_date) >= new Date();
  const registrationOpen =
    !event.registration_deadline ||
    new Date(event.registration_deadline) >= new Date();
  const canJoin = isUpcoming && registrationOpen;

  useEffect(() => {
    setJoined(isJoined);
  }, [isJoined]);

  useEffect(() => {
    setParticipantCount(event.participant_count ?? 0);
  }, [event.participant_count]);

  const updateParticipation = (nextJoined: boolean, nextCount: number) => {
    setJoined(nextJoined);
    setParticipantCount(nextCount);
    onParticipationChange?.(event.id, nextJoined, nextCount);
  };

  const handleJoin = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để tham gia sự kiện");
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setLoading(true);
    const result = await joinEvent(event.id);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    updateParticipation(true, participantCount + 1);
    router.refresh();
  };

  const handleLeave = async () => {
    setLoading(true);
    const result = await leaveEvent(event.id);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    updateParticipation(false, Math.max(0, participantCount - 1));
    router.refresh();
  };

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
          <CardTitle className="text-lg">
            <Link
              href={`/events/${event.id}`}
              className="hover:text-primary hover:underline"
            >
              {event.name}
            </Link>
          </CardTitle>
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
          <span>{formatDate(event.event_date)}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{event.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <Link
            href={`/events/${event.id}`}
            className="hover:text-primary hover:underline"
          >
            <span>{participantCount} thành viên đã tham gia</span>
          </Link>
        </div>

        {event.registration_deadline && (
          <p className="text-xs text-muted-foreground">
            Hạn đăng ký: {formatDate(event.registration_deadline)}
            {!registrationOpen && " (đã hết hạn)"}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/events/${event.id}`}>Xem chi tiết</Link>
        </Button>

        {enableParticipation && (
          <>
            {canJoin ? (
              userId ? (
                joined ? (
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    onClick={handleLeave}
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Hủy tham gia"}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleJoin}
                    disabled={loading}
                  >
                    {loading ? "Đang xử lý..." : "Tham gia"}
                  </Button>
                )
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
                  }
                >
                  Đăng nhập để tham gia
                </Button>
              )
            ) : (
              <span className="text-center text-sm text-muted-foreground">
                {!isUpcoming ? "Sự kiện đã kết thúc" : "Đã hết hạn đăng ký"}
              </span>
            )}
          </>
        )}

        {event.event_link && registrationOpen && isUpcoming && (
          <Button asChild variant="secondary" className="w-full">
            <Link href={event.event_link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Đăng ký bên ngoài
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

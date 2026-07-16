"use client";

import { joinEvent, leaveEvent } from "@/app/actions/eventParticipantActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EventParticipationActionsProps {
  eventId: string;
  userId: string | null;
  initialJoined: boolean;
  canJoin: boolean;
  closedMessage?: string;
  loginRedirect?: string;
  onParticipantCountChange?: (count: number) => void;
  initialParticipantCount?: number;
  className?: string;
  fullWidth?: boolean;
}

export function EventParticipationActions({
  eventId,
  userId,
  initialJoined,
  canJoin,
  closedMessage = "Không thể tham gia sự kiện này",
  loginRedirect = "/events",
  onParticipantCountChange,
  initialParticipantCount = 0,
  className,
  fullWidth = false,
}: EventParticipationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(initialJoined);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);

  useEffect(() => {
    setJoined(initialJoined);
  }, [initialJoined]);

  useEffect(() => {
    setParticipantCount(initialParticipantCount);
  }, [initialParticipantCount]);

  const updateCount = (nextCount: number) => {
    setParticipantCount(nextCount);
    onParticipantCountChange?.(nextCount);
  };

  const handleJoin = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để tham gia sự kiện");
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setLoading(true);
    const result = await joinEvent(eventId);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setJoined(true);
    updateCount(participantCount + 1);
    router.refresh();
  };

  const handleLeave = async () => {
    setLoading(true);
    const result = await leaveEvent(eventId);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setJoined(false);
    updateCount(Math.max(0, participantCount - 1));
    router.refresh();
  };

  if (!canJoin) {
    return (
      <p className={className ?? "text-sm text-muted-foreground"}>{closedMessage}</p>
    );
  }

  if (!userId) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
        }
        className={cn(fullWidth && "w-full", className)}
      >
        Đăng nhập để tham gia
      </Button>
    );
  }

  if (joined) {
    return (
      <Button
        variant="outline"
        onClick={handleLeave}
        disabled={loading}
        className={cn(
          "border-red-300 text-red-600 hover:bg-red-50",
          fullWidth && "w-full",
          className
        )}
      >
        {loading ? "Đang xử lý..." : "Hủy tham gia"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={loading}
      className={cn("bg-blue-600 hover:bg-blue-700", fullWidth && "w-full", className)}
    >
      {loading ? "Đang xử lý..." : "Tham gia"}
    </Button>
  );
}

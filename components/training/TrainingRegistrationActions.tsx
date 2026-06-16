"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  registerForTraining,
  unregisterFromTraining,
} from "@/app/actions/trainingParticipantActions";

interface TrainingRegistrationActionsProps {
  trainingId: string;
  userId: string | null;
  initialRegistered: boolean;
  isCompleted: boolean;
  loginRedirect?: string;
  onParticipantCountChange?: (count: number) => void;
  initialParticipantCount?: number;
  className?: string;
}

export function TrainingRegistrationActions({
  trainingId,
  userId,
  initialRegistered,
  isCompleted,
  loginRedirect = "/training",
  onParticipantCountChange,
  initialParticipantCount = 0,
  className,
}: TrainingRegistrationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(initialRegistered);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);

  useEffect(() => {
    setRegistered(initialRegistered);
  }, [initialRegistered]);

  useEffect(() => {
    setParticipantCount(initialParticipantCount);
  }, [initialParticipantCount]);

  const updateCount = (nextCount: number) => {
    setParticipantCount(nextCount);
    onParticipantCountChange?.(nextCount);
  };

  const handleRegister = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để đăng ký");
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setLoading(true);
    const result = await registerForTraining(trainingId);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setRegistered(true);
    updateCount(participantCount + 1);
    router.refresh();
  };

  const handleUnregister = async () => {
    setLoading(true);
    const result = await unregisterFromTraining(trainingId);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setRegistered(false);
    updateCount(Math.max(0, participantCount - 1));
    router.refresh();
  };

  if (isCompleted) {
    return (
      <p className={className ?? "text-sm text-muted-foreground"}>Buổi tập đã diễn ra</p>
    );
  }

  if (!userId) {
    return (
      <Button
        variant="outline"
        onClick={() =>
          router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
        }
        className={className}
      >
        Đăng nhập để tham gia
      </Button>
    );
  }

  if (registered) {
    return (
      <Button
        variant="outline"
        onClick={handleUnregister}
        disabled={loading}
        className={
          className ??
          "border-red-300 text-red-600 hover:bg-red-50"
        }
      >
        {loading ? "Đang xử lý..." : "Hủy đăng ký"}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleRegister}
      disabled={loading}
      className={className ?? "bg-blue-600 hover:bg-blue-700"}
    >
      {loading ? "Đang xử lý..." : "Tham gia"}
    </Button>
  );
}

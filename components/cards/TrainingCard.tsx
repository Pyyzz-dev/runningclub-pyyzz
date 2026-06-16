"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getTrainingStatus,
  getTrainingStatusColor,
  getTrainingStatusText,
} from "@/lib/utils/trainingStatus";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { downloadICS, formatDateTime, generateICS } from "@/lib/format";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { CalendarPlus, Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  registerForTraining,
  unregisterFromTraining,
} from "@/app/actions/trainingParticipantActions";

interface TrainingCardProps {
  training: TrainingSchedule;
  isAdmin?: boolean;
  className?: string;
  onDownloadICS?: (icsContent: string) => void;
  userId?: string | null;
  isRegistered?: boolean;
  enableRegistration?: boolean;
  loginRedirect?: string;
  onRegistrationChange?: (
    trainingId: string,
    registered: boolean,
    participantCount: number
  ) => void;
}

export function TrainingCard({
  training,
  isAdmin = false,
  className,
  onDownloadICS,
  userId = null,
  isRegistered = false,
  enableRegistration = false,
  loginRedirect = "/training",
  onRegistrationChange,
}: TrainingCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(isRegistered);

  const status = getTrainingStatus(training.start_time, training.end_time);
  const isCompleted = status === "completed";

  useEffect(() => {
    setRegistered(isRegistered);
  }, [isRegistered]);

  const handleDownload = () => {
    const icsContent = generateICS({
      title: training.title,
      description: training.description,
      location: training.location,
      startTime: training.start_time,
      endTime: training.end_time,
    });

    if (onDownloadICS) {
      onDownloadICS(icsContent);
    } else {
      downloadICS(icsContent, `${training.title.replace(/\s+/g, "-")}.ics`);
    }
  };

  const updateRegistration = (nextRegistered: boolean, nextCount: number) => {
    setRegistered(nextRegistered);
    onRegistrationChange?.(training.id, nextRegistered, nextCount);
  };

  const handleRegister = async () => {
    if (!userId) {
      toast.error("Vui lòng đăng nhập để đăng ký");
      router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setLoading(true);
    const result = await registerForTraining(training.id);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    updateRegistration(true, (training.participant_count ?? 0) + 1);
    router.refresh();
  };

  const handleUnregister = async () => {
    setLoading(true);
    const result = await unregisterFromTraining(training.id);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    updateRegistration(
      false,
      Math.max(0, (training.participant_count ?? 0) - 1)
    );
    router.refresh();
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <Link
              href={`/training/${training.id}`}
              className="hover:text-primary hover:underline"
            >
              {training.title}
            </Link>
          </CardTitle>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-1 text-xs font-medium",
              getTrainingStatusColor(status)
            )}
            suppressHydrationWarning
          >
            {getTrainingStatusText(status)}
          </span>
        </div>
        {training.description && (
          <CardDescription className="line-clamp-3">
            {training.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {formatDateTime(training.start_time)}
            {training.end_time && ` – ${formatDateTime(training.end_time)}`}
          </span>
        </div>

        {training.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{training.location}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4 shrink-0" />
          <Link
            href={`/training/${training.id}`}
            className="hover:text-primary hover:underline"
          >
            <span>{training.participant_count ?? 0} đã đăng ký</span>
          </Link>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/training/${training.id}`}>Xem chi tiết</Link>
        </Button>

        <Button variant="outline" size="sm" onClick={handleDownload}>
          <CalendarPlus className="h-4 w-4" />
          Thêm vào lịch
        </Button>

        {enableRegistration && (
          <>
            {userId && !isCompleted ? (
              registered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnregister}
                  disabled={loading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {loading ? "Đang xử lý..." : "Hủy đăng ký"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRegister}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Đang xử lý..." : "Tham gia"}
                </Button>
              )
            ) : !userId && !isCompleted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)
                }
              >
                Đăng nhập để tham gia
              </Button>
            ) : isCompleted ? (
              <span className="text-sm text-muted-foreground">Đã diễn ra</span>
            ) : null}
          </>
        )}

        {isAdmin && (
          <Badge variant="outline" className="ml-auto">
            Quản trị
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}

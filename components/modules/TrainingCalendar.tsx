"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrainingCard } from "@/components/cards/TrainingCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import {
  getTrainingStatus,
  type TrainingStatus,
} from "@/lib/utils/trainingStatus";
import { CalendarDays } from "lucide-react";

interface TrainingCalendarProps {
  trainings: TrainingSchedule[];
  isAdmin?: boolean;
  userId?: string | null;
  registeredMap?: Record<string, boolean>;
  className?: string;
}

function getWeekBounds(dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(date);
  start.setDate(date.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function TrainingCalendar({
  trainings: initialTrainings,
  isAdmin = false,
  userId = null,
  registeredMap: initialRegisteredMap = {},
  className,
}: TrainingCalendarProps) {
  const router = useRouter();
  const [trainings, setTrainings] = useState(initialTrainings);
  const [registeredMap, setRegisteredMap] = useState(initialRegisteredMap);
  const [weekDate, setWeekDate] = useState(() =>
    toDateInputValue(new Date())
  );
  const [statusFilter, setStatusFilter] = useState<"all" | TrainingStatus>("all");

  useEffect(() => {
    setTrainings(initialTrainings);
  }, [initialTrainings]);

  useEffect(() => {
    setRegisteredMap(initialRegisteredMap);
  }, [initialRegisteredMap]);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60_000);

    return () => clearInterval(interval);
  }, [router]);

  const filteredTrainings = useMemo(() => {
    const { start, end } = getWeekBounds(weekDate);

    return trainings
      .filter((training) => {
        const startTime = new Date(training.start_time);
        const inWeek = startTime >= start && startTime <= end;
        const matchesStatus =
          statusFilter === "all" ||
          getTrainingStatus(training.start_time, training.end_time) === statusFilter;
        return inWeek && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [trainings, weekDate, statusFilter]);

  const { start, end } = getWeekBounds(weekDate);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="week-filter" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Chọn tuần
          </Label>
          <Input
            id="week-filter"
            type="date"
            value={weekDate}
            onChange={(e) => setWeekDate(e.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {start.toLocaleDateString("vi-VN")} – {end.toLocaleDateString("vi-VN")}
        </p>
        <div className="space-y-2 sm:ml-auto">
          <Label htmlFor="status-filter" className="sr-only">
            Lọc theo trạng thái
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | TrainingStatus)}
          >
            <SelectTrigger id="status-filter" className="w-full sm:w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
              <SelectItem value="ongoing">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Đã diễn ra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredTrainings.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          Không có buổi tập nào trong tuần này.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredTrainings.map((training) => (
            <TrainingCard
              key={training.id}
              training={training}
              isAdmin={isAdmin}
              userId={userId}
              isRegistered={registeredMap[training.id] ?? false}
              enableRegistration
              onRegistrationChange={(trainingId, registered, participantCount) => {
                setRegisteredMap((prev) => ({ ...prev, [trainingId]: registered }));
                setTrainings((prev) =>
                  prev.map((item) =>
                    item.id === trainingId
                      ? { ...item, participant_count: participantCount }
                      : item
                  )
                );
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

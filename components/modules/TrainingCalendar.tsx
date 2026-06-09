"use client";

import { useMemo, useState } from "react";
import { TrainingCard } from "@/components/cards/TrainingCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

interface TrainingCalendarProps {
  trainings: TrainingSchedule[];
  isAdmin?: boolean;
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
  trainings,
  isAdmin = false,
  className,
}: TrainingCalendarProps) {
  const [weekDate, setWeekDate] = useState(() =>
    toDateInputValue(new Date())
  );

  const filteredTrainings = useMemo(() => {
    const { start, end } = getWeekBounds(weekDate);

    return trainings
      .filter((training) => {
        const startTime = new Date(training.start_time);
        return startTime >= start && startTime <= end;
      })
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [trainings, weekDate]);

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
            />
          ))}
        </div>
      )}
    </div>
  );
}

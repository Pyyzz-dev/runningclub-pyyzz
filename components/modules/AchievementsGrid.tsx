"use client";

import { AchievementCard } from "@/components/cards/AchievementCard";
import type { Achievement } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface AchievementsGridProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementsGrid({ achievements, className }: AchievementsGridProps) {
  if (achievements.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có thành tích nào.
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
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

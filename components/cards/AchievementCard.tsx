import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { Achievement } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Medal, Trophy } from "lucide-react";
import Image from "next/image";

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
}

export function AchievementCard({ achievement, className }: AchievementCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {achievement.image_url && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={achievement.image_url}
            alt={achievement.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-secondary-500" />
            {achievement.title}
          </CardTitle>
          {achievement.medal_type && (
            <Badge variant="secondary" className="shrink-0">
              <Medal className="mr-1 h-3 w-3" />
              {achievement.medal_type}
            </Badge>
          )}
        </div>
        <CardDescription>{formatDate(achievement.achieved_date)}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
      </CardContent>
    </Card>
  );
}

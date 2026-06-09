import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardWithUser } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Medal } from "lucide-react";

interface LeaderboardCardProps {
  rank: number;
  entry: LeaderboardWithUser;
  isCurrentUser?: boolean;
  className?: string;
}

function getMedalColor(rank: number): string | null {
  if (rank === 1) return "text-yellow-500";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-amber-700";
  return null;
}

function formatPace(pace: number | null): string {
  if (pace == null) return "—";
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} phút`;
  return `${hours}g ${mins}p`;
}

export function LeaderboardCard({
  rank,
  entry,
  isCurrentUser = false,
  className,
}: LeaderboardCardProps) {
  const medalColor = getMedalColor(rank);
  const initials = entry.user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "transition-colors",
        isCurrentUser && "border-primary bg-primary/5 ring-1 ring-primary/20",
        className
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex w-10 shrink-0 items-center justify-center">
          {medalColor ? (
            <Medal className={cn("h-6 w-6", medalColor)} />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">{rank}</span>
          )}
        </div>

        <Avatar className="h-10 w-10">
          <AvatarImage src={entry.user.avatar_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{entry.user.full_name}</p>
            {isCurrentUser && (
              <Badge variant="outline" className="shrink-0 text-xs">
                Bạn
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.total_distance_km.toFixed(1)} km · {formatDuration(entry.total_time_minutes)} ·{" "}
            {formatPace(entry.average_pace)}
          </p>
        </div>

        <div className="hidden shrink-0 text-right sm:block">
          <p className="font-display text-xl font-bold text-primary">
            #{rank}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

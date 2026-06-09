import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaderboardEntry } from "@/lib/types/leaderboard";
import { cn } from "@/lib/utils";
import { Medal, Trophy } from "lucide-react";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentMemberName?: string | null;
  className?: string;
}

function getMedalIcon(rank: number) {
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-yellow-500" aria-hidden />;
  }
  if (rank === 2) {
    return <Medal className="h-5 w-5 text-gray-400" aria-hidden />;
  }
  if (rank === 3) {
    return <Medal className="h-5 w-5 text-amber-600" aria-hidden />;
  }
  return null;
}

export function LeaderboardTable({
  data,
  currentMemberName,
  className,
}: LeaderboardTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Chưa có dữ liệu bảng xếp hạng.
      </div>
    );
  }

  const normalizedCurrentName = currentMemberName?.trim().toLowerCase();

  return (
    <div className={cn("overflow-x-auto rounded-lg border bg-white shadow-sm", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="w-16 text-center text-primary-foreground">#</TableHead>
            <TableHead className="text-primary-foreground">Thành viên</TableHead>
            <TableHead className="text-center text-primary-foreground">
              Tổng hoạt động
            </TableHead>
            <TableHead className="text-center text-primary-foreground">
              Hoạt động hợp lệ
            </TableHead>
            <TableHead className="text-center text-primary-foreground">Tổng km</TableHead>
            <TableHead className="text-center text-primary-foreground">
              Tổng thời gian
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => {
            const isCurrentUser =
              normalizedCurrentName &&
              entry.memberName.trim().toLowerCase() === normalizedCurrentName;

            return (
              <TableRow
                key={`${entry.rank}-${entry.memberName}`}
                className={cn(isCurrentUser && "bg-primary/5 font-medium")}
              >
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1 font-semibold">
                    {getMedalIcon(entry.rank)}
                    <span>{entry.rank}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {entry.memberName}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs text-primary">(Bạn)</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{entry.totalActivities}</TableCell>
                <TableCell className="text-center">{entry.validActivities}</TableCell>
                <TableCell className="text-center font-mono">
                  {entry.totalKm.toFixed(2)} km
                </TableCell>
                <TableCell className="text-center font-mono">{entry.totalTime}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

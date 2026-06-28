"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/lib/types/leaderboard";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Medal, Trophy } from "lucide-react";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentMemberName?: string | null;
  itemsPerPage?: number;
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
  itemsPerPage = 10,
  className,
}: LeaderboardTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex]
  );

  const normalizedCurrentName = currentMemberName?.trim().toLowerCase();

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Chưa có dữ liệu bảng xếp hạng.
      </div>
    );
  }

  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (currentPage <= 3) return i + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + i;
    return currentPage - 2 + i;
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
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
            {currentData.map((entry) => {
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

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <p className="text-sm text-muted-foreground">
            Hiển thị <strong>{startIndex + 1}</strong> –{" "}
            <strong>{Math.min(endIndex, data.length)}</strong> /{" "}
            <strong>{data.length}</strong> thành viên
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Trước</span>
            </Button>

            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className={cn(
                  "h-8 w-8",
                  currentPage === pageNum && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {pageNum}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 px-3"
            >
              <span className="mr-1 hidden sm:inline">Sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

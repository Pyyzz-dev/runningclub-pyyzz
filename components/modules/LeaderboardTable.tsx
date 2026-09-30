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
import { Pagination } from "@/components/common/Pagination";
import type { LeaderboardEntry } from "@/lib/types/leaderboard";
import { ITEMS_PER_PAGE, slicePage } from "@/lib/utils/pagination";
import { cn } from "@/lib/utils";
import { Medal, Trophy } from "lucide-react";

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentMemberName?: string | null;
  itemsPerPage?: number;
  initialPage?: number;
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
  itemsPerPage = ITEMS_PER_PAGE,
  initialPage = 1,
  className,
}: LeaderboardTableProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { items, totalPages, totalItems } = useMemo(
    () => slicePage(data, currentPage, itemsPerPage),
    [data, currentPage, itemsPerPage]
  );

  const normalizedCurrentName = currentMemberName?.trim().toLowerCase();

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const params = new URLSearchParams(window.location.search);
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname
    );
  };

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Chưa có dữ liệu bảng xếp hạng.
      </div>
    );
  }

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
            {items.map((entry) => {
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

      <Pagination
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

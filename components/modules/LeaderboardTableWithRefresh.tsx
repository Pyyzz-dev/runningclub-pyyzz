"use client";

import { useCallback, useEffect, useState } from "react";
import { getLeaderboardFromSheetWithError } from "@/app/actions/leaderboardActions";
import { LeaderboardTable } from "@/components/modules/LeaderboardTable";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry } from "@/lib/types/leaderboard";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 giờ

interface LeaderboardTableWithRefreshProps {
  initialData: LeaderboardEntry[];
  currentMemberName?: string | null;
  className?: string;
}

export function LeaderboardTableWithRefresh({
  initialData,
  currentMemberName,
  className,
}: LeaderboardTableWithRefreshProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(
    initialData.length > 0 ? new Date() : null
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await getLeaderboardFromSheetWithError();

    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data ?? []);
      setLastUpdated(new Date());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Dữ liệu được đồng bộ từ Google Sheets
          {lastUpdated && (
            <> · Cập nhật lúc {lastUpdated.toLocaleString("vi-VN")}</>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner label="Đang tải dữ liệu..." />
        </div>
      ) : error ? (
        <p className="py-8 text-center text-destructive">{error}</p>
      ) : (
        <LeaderboardTable data={data} currentMemberName={currentMemberName} />
      )}
    </div>
  );
}

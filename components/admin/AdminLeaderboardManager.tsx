"use client";

import { useEffect, useState } from "react";
import { updateLeaderboard } from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/lib/supabase/types";
import { getMonthPeriod, getWeekPeriod } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface AdminLeaderboardManagerProps {
  members: User[];
  className?: string;
}

type PeriodType = "weekly" | "monthly";

export function AdminLeaderboardManager({
  members,
  className,
}: AdminLeaderboardManagerProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [userId, setUserId] = useState("");
  const [totalDistance, setTotalDistance] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [averagePace, setAveragePace] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { start, end } =
      periodType === "weekly" ? getWeekPeriod() : getMonthPeriod();
    setPeriodStart(start);
    setPeriodEnd(end);
  }, [periodType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Vui lòng chọn thành viên");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("user_id", userId);
    formData.set("total_distance_km", totalDistance);
    formData.set("total_time_minutes", totalTime);
    if (averagePace) {
      formData.set("average_pace", averagePace);
    }
    formData.set("period_type", periodType);
    formData.set("period_start", periodStart);
    formData.set("period_end", periodEnd);

    const result = await updateLeaderboard(formData);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã cập nhật bảng xếp hạng");
    setTotalDistance("");
    setTotalTime("");
    setAveragePace("");
  };

  return (
    <Card className={cn("max-w-xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Trophy className="h-5 w-5 text-secondary-500" />
          Cập nhật bảng xếp hạng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Thành viên</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thành viên" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Loại kỳ</Label>
            <Select
              value={periodType}
              onValueChange={(value) => setPeriodType(value as PeriodType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Theo tuần</SelectItem>
                <SelectItem value="monthly">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="period_start">Ngày bắt đầu</Label>
              <Input
                id="period_start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Ngày kết thúc</Label>
              <Input
                id="period_end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="total_distance_km">Quãng đường (km)</Label>
              <Input
                id="total_distance_km"
                type="number"
                step="0.1"
                min="0"
                value={totalDistance}
                onChange={(e) => setTotalDistance(e.target.value)}
                required
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_time_minutes">Thời gian (phút)</Label>
              <Input
                id="total_time_minutes"
                type="number"
                min="0"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="average_pace">Pace trung bình (phút/km, tùy chọn)</Label>
            <Input
              id="average_pace"
              type="number"
              step="0.01"
              min="0"
              value={averagePace}
              onChange={(e) => setAveragePace(e.target.value)}
              placeholder="5.30"
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Cập nhật"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

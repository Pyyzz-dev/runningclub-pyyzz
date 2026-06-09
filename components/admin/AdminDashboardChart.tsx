"use client";

import type { AdminDashboardStats } from "@/lib/utils/db-helpers";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminDashboardChartProps {
  stats: AdminDashboardStats;
  className?: string;
}

export function AdminDashboardChart({ stats, className }: AdminDashboardChartProps) {
  const data = [
    { name: "Thành viên", value: stats.memberCount },
    { name: "Bài viết", value: stats.publishedPostCount },
    { name: "Buổi tập", value: stats.upcomingTrainingCount },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 dark:border-slate-800 dark:bg-slate-950",
        className
      )}
    >
      <h3 className="mb-4 font-display text-lg font-semibold">
        Thống kê tổng quan
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border dark:stroke-slate-700"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value) => [value, "Số lượng"]}
          />
          <Bar
            dataKey="value"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
            name="Số lượng"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

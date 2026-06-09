import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminDashboardStats } from "@/lib/utils/db-helpers";
import { cn } from "@/lib/utils";
import { CalendarDays, FileText, Users } from "lucide-react";

interface AdminStatsCardsProps {
  stats: AdminDashboardStats;
}

const cards = [
  {
    key: "memberCount" as const,
    label: "Thành viên",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "publishedPostCount" as const,
    label: "Bài viết đã xuất bản",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "upcomingTrainingCount" as const,
    label: "Buổi tập sắp tới",
    icon: CalendarDays,
    color: "text-amber-600 dark:text-amber-400",
  },
];

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className={cn("h-4 w-4", color)} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

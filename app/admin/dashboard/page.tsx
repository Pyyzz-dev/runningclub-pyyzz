import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Calendar, FileText, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [postsRes, trainingsRes, membersRes] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("training_schedule").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "member"),
  ]);

  const stats = [
    {
      label: "Tổng bài viết",
      value: postsRes.count ?? 0,
      icon: FileText,
    },
    {
      label: "Tổng buổi tập",
      value: trainingsRes.count ?? 0,
      icon: Calendar,
    },
    {
      label: "Tổng thành viên",
      value: membersRes.count ?? 0,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Tổng quan hoạt động câu lạc bộ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

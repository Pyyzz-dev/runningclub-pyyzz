import type { Metadata } from "next";
import Link from "next/link";
import { Calendar, MessageSquare, Trophy } from "lucide-react";
import { Section } from "@/components/common/Section";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/utils/db-helpers";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

async function DashboardContent() {
  const { data: user } = await getCurrentUser();

  return (
    <Section
      title={`Xin chào, ${user?.full_name ?? "Thành viên"}!`}
      subtitle="Trung tâm điều hướng nhanh cho thành viên CLB"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-slide-up">
          <CardHeader>
            <MessageSquare className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Cộng đồng</CardTitle>
            <CardDescription>Đọc và bình luận bài viết mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/community">Vào cộng đồng</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <Calendar className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Lịch tập</CardTitle>
            <CardDescription>Xem lịch tập sắp tới</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/training">Xem lịch tập</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <Trophy className="mb-2 h-8 w-8 text-primary" />
            <CardTitle className="text-lg">Bảng xếp hạng</CardTitle>
            <CardDescription>Theo dõi thành tích của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/leaderboard">Xem bảng xếp hạng</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Button asChild variant="link">
          <Link href="/profile">Quản lý hồ sơ & đổi mật khẩu →</Link>
        </Button>
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils/db-helpers";

export const metadata: Metadata = {
  title: "Hồ sơ cá nhân",
};

export default async function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

async function ProfileContent() {
  const { data: user } = await getCurrentUser();

  if (!user) return null;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Section
      title="Hồ sơ cá nhân"
      subtitle="Quản lý thông tin và bảo mật tài khoản"
      containerClassName="max-w-4xl"
    >
      <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Hồ sơ cá nhân" },
          ]}
          className="mb-8"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>Thông tin cơ bản của bạn trong CLB</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-lg font-semibold">{user.full_name}</p>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1">
                    {user.role === "admin" ? "Quản trị viên" : "Thành viên"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{user.full_name}</p>
                </div>
              </div>

              {authUser?.email && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{authUser.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu đăng nhập của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
    </Section>
  );
}

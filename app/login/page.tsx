import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { LoginPageForm } from "@/components/forms/LoginPageForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

export default function LoginPage() {
  return (
    <Section
      title="Đăng nhập"
      subtitle="Đăng nhập để tham gia cộng đồng CLB"
      containerClassName="max-w-lg"
    >
      <Card className="mx-auto animate-slide-up">
        <CardHeader>
          <CardTitle>Chào mừng trở lại</CardTitle>
          <CardDescription>
            Sử dụng tài khoản do quản trị viên cấp để đăng nhập.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tải...</p>}>
            <LoginPageForm />
          </Suspense>
        </CardContent>
      </Card>
    </Section>
  );
}

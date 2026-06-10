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
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng nhập</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu để truy cập hệ thống. Tài khoản được kích hoạt sau khi
            admin phê duyệt đơn đăng ký.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Đang tải...</p>}>
            <LoginPageForm showRegisterLink />
          </Suspense>
        </CardContent>
      </Card>
    </Section>
  );
}

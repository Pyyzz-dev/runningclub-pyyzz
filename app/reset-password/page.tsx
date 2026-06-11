import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/common/Section";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
};

export default function ResetPasswordPage() {
  return (
    <Section
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu mới cho tài khoản của bạn"
      containerClassName="max-w-lg"
    >
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">Đang tải...</p>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </Section>
  );
}

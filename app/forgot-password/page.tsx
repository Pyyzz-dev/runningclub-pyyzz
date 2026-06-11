import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
};

export default function ForgotPasswordPage() {
  return (
    <Section
      title="Quên mật khẩu"
      subtitle="Nhận link đặt lại mật khẩu qua email"
      containerClassName="max-w-lg"
    >
      <ForgotPasswordForm />
    </Section>
  );
}

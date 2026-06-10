import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { RegisterMemberForm } from "@/components/forms/RegisterMemberForm";

export const metadata: Metadata = {
  title: "Đăng ký thành viên",
};

export default function RegisterPage() {
  return (
    <Section
      title="Đăng ký thành viên"
      subtitle="Gửi đơn đăng ký — admin sẽ phê duyệt trước khi kích hoạt tài khoản"
      containerClassName="max-w-lg"
    >
      <RegisterMemberForm />
    </Section>
  );
}

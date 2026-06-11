import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EventList } from "@/components/modules/EventList";
import { fetchUpcomingEvents } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sự kiện",
};

export default async function EventsPage() {
  const { data: events, error } = await fetchUpcomingEvents(50);

  return (
    <Section title="Sự kiện" subtitle="Các giải chạy và hoạt động sắp diễn ra">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Sự kiện" }]}
        className="mb-8"
      />
      <AuthGuard message="Hãy đăng ký tài khoản và trở thành thành viên CLB để theo dõi lịch sự kiện của CLB">
        {error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : (
          <EventList events={events ?? []} />
        )}
      </AuthGuard>
    </Section>
  );
}

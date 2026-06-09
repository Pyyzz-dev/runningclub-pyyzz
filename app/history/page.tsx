import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { HistoryTimeline } from "@/components/modules/HistoryTimeline";
import { fetchHistoryTimeline } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Phòng truyền thống",
};

export default async function HistoryPage() {
  const { data: history, error } = await fetchHistoryTimeline();

  return (
    <Section title="Phòng truyền thống" subtitle="Hành trình phát triển của CLB qua các năm">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Phòng truyền thống" },
        ]}
        className="mb-8"
      />
      {error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <HistoryTimeline items={history ?? []} />
      )}
    </Section>
  );
}

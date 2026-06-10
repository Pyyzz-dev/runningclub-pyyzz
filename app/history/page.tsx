import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { HistoryEventList } from "@/components/history/HistoryEventList";
import { fetchHistoryTimeline } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Phòng truyền thống",
};

export default async function HistoryPage() {
  const { data: history, error } = await fetchHistoryTimeline();

  const listItems =
    history?.map(({ id, title, event_date }) => ({ id, title, event_date })) ?? [];

  return (
    <>
      <div className="container-custom pt-6">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Phòng truyền thống" },
          ]}
        />
      </div>

      <Section
        title="Phòng truyền thống"
        subtitle="Hành trình phát triển của CLB qua các năm"
        className="!pt-4"
      >
        {error ? (
          <p className="text-center text-destructive">{error}</p>
        ) : (
          <HistoryEventList items={listItems} />
        )}
      </Section>
    </>
  );
}

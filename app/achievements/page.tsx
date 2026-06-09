import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AchievementsGrid } from "@/components/modules/AchievementsGrid";
import { fetchAchievements } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Thành tích",
};

export default async function AchievementsPage() {
  const { data: achievements, error } = await fetchAchievements();

  return (
    <Section title="Thành tích CLB" subtitle="Những dấu ấn đáng tự hào của cộng đồng">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Thành tích" }]}
        className="mb-8"
      />
      {error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <AchievementsGrid achievements={achievements ?? []} />
      )}
    </Section>
  );
}

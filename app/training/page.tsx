import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { TrainingCalendar } from "@/components/modules/TrainingCalendar";
import { fetchCurrentUser, fetchUpcomingTraining } from "@/app/actions/dataActions";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Lịch tập",
};

export default async function TrainingPage() {
  const [{ data: trainings, error }, { data: user }] = await Promise.all([
    fetchUpcomingTraining(50),
    fetchCurrentUser(),
  ]);

  return (
    <Section title="Lịch tập" subtitle="Các buổi tập sắp tới của CLB">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Lịch tập" }]}
        className="mb-8"
      />
      {error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : (
        <TrainingCalendar
          trainings={trainings ?? []}
          isAdmin={user?.role === "admin"}
        />
      )}
    </Section>
  );
}

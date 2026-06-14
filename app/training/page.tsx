import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { TrainingCalendar } from "@/components/modules/TrainingCalendar";
import { fetchAllTrainings, fetchCurrentUser } from "@/app/actions/dataActions";
import { getUserTrainingRegistrations } from "@/app/actions/trainingParticipantActions";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Lịch tập",
};

export default async function TrainingPage() {
  const [{ data: trainings, error }, { data: user }] = await Promise.all([
    fetchAllTrainings(),
    fetchCurrentUser(),
  ]);

  const registeredMap = user ? await getUserTrainingRegistrations(user.id) : {};

  return (
    <Section title="Lịch tập" subtitle="Lịch tập của câu lạc bộ">
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
          userId={user?.id ?? null}
          registeredMap={registeredMap}
        />
      )}
    </Section>
  );
}

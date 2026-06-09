import type { Metadata } from "next";
import { TrainingManager } from "@/components/admin/TrainingManager";
import { getTrainings } from "@/app/actions/trainingActions";

export const metadata: Metadata = {
  title: "Quản lý Lịch tập",
};

export default async function AdminTrainingPage() {
  const trainings = await getTrainings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Lịch tập</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các buổi tập của câu lạc bộ.
        </p>
      </div>

      <TrainingManager trainings={trainings} />
    </div>
  );
}

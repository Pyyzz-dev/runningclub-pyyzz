export type TrainingStatus = "upcoming" | "ongoing" | "completed";

export function getTrainingStatus(
  startTime: string,
  endTime: string | null
): TrainingStatus {
  const now = new Date();
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : start;

  if (now > end) return "completed";
  if (now >= start && now <= end) return "ongoing";
  return "upcoming";
}

export function getTrainingStatusText(status: TrainingStatus): string {
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
      return "Đang diễn ra";
    case "completed":
      return "Đã diễn ra";
  }
}

export function getTrainingStatusColor(status: TrainingStatus): string {
  switch (status) {
    case "upcoming":
      return "bg-blue-100 text-blue-700";
    case "ongoing":
      return "bg-green-100 text-green-700";
    case "completed":
      return "bg-gray-100 text-gray-500";
  }
}

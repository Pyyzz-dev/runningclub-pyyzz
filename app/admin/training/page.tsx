import type { Metadata } from "next";
import { TrainingManager } from "@/components/admin/TrainingManager";
import { Pagination } from "@/components/common/Pagination";
import { getTrainings } from "@/app/actions/trainingActions";
import {
  firstSearchParam,
  ITEMS_PER_PAGE,
  parsePageParam,
} from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";
import type { TrainingStatus } from "@/lib/utils/trainingStatus";

export const metadata: Metadata = {
  title: "Quản lý Lịch tập",
};

type AdminTrainingPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    month?: string;
    status?: string;
  }>;
};

function parseTrainingStatus(
  value?: string
): "all" | TrainingStatus {
  if (value === "upcoming" || value === "ongoing" || value === "completed") {
    return value;
  }
  return "all";
}

export default async function AdminTrainingPage({
  searchParams,
}: AdminTrainingPageProps) {
  const params = await searchParams;
  const search = firstSearchParam(params.search)?.trim() ?? "";
  const month = firstSearchParam(params.month) ?? "";
  const status = parseTrainingStatus(firstSearchParam(params.status));
  const result = await getTrainings({
    page: parsePageParam(params.page),
    search: search || undefined,
    month: month || undefined,
    status,
  });
  redirectIfPageOutOfRange(
    "/admin/training",
    {
      page: params.page,
      search: search || undefined,
      month: month || undefined,
      status: status === "all" ? undefined : status,
    },
    parsePageParam(params.page),
    result.totalPages,
    result.count
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Lịch tập</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các buổi tập của câu lạc bộ.
        </p>
      </div>

      <TrainingManager
        trainings={result.data}
        search={search}
        month={month}
        status={status}
      />
      <Pagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalItems={result.count}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}

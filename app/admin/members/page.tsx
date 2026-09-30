import type { Metadata } from "next";
import { MembersTable } from "@/components/admin/MembersTable";
import { Pagination } from "@/components/common/Pagination";
import { fetchApprovedMembersPaginated } from "@/app/actions/dataActions";
import {
  firstSearchParam,
  ITEMS_PER_PAGE,
  parsePageParam,
} from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";

export const metadata: Metadata = {
  title: "Danh sách thành viên",
};

type AdminMembersPageProps = {
  searchParams: Promise<{ page?: string; search?: string }>;
};

export default async function AdminMembersPage({
  searchParams,
}: AdminMembersPageProps) {
  const params = await searchParams;
  const currentPage = parsePageParam(params.page);
  const search = firstSearchParam(params.search)?.trim() ?? "";
  const result = await fetchApprovedMembersPaginated(
    currentPage,
    search || undefined
  );

  if (result.error) {
    console.error("Error fetching members:", result.error);
    return <div className="text-destructive">Lỗi tải dữ liệu: {result.error}</div>;
  }

  redirectIfPageOutOfRange(
    "/admin/members",
    { page: params.page, search: search || undefined },
    currentPage,
    result.totalPages,
    result.count
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Danh sách thành viên</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng số thành viên: <strong>{result.count}</strong>
        </p>
      </div>

      <MembersTable
        members={result.data}
        search={search}
        startIndex={(result.currentPage - 1) * ITEMS_PER_PAGE}
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

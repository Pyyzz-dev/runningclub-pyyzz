import type { Metadata } from "next";
import { PendingMembersTable } from "@/components/admin/PendingMembersTable";
import { Pagination } from "@/components/common/Pagination";
import { getPendingMembers } from "@/app/actions/adminApproveMember";
import { ITEMS_PER_PAGE, parsePageParam } from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";

export const metadata: Metadata = {
  title: "Duyệt thành viên",
};

type PendingMembersPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function PendingMembersPage({
  searchParams,
}: PendingMembersPageProps) {
  const { page } = await searchParams;
  const currentPage = parsePageParam(page);
  const result = await getPendingMembers(currentPage);
  redirectIfPageOutOfRange(
    "/admin/members/pending",
    { page },
    currentPage,
    result.totalPages,
    result.count
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Duyệt thành viên mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xét duyệt các đơn đăng ký tham gia CLB
        </p>
      </div>

      <PendingMembersTable
        initialData={result.data}
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

import type { Metadata } from "next";
import { PostManager } from "@/components/admin/PostManager";
import { Pagination } from "@/components/common/Pagination";
import { getAllPosts } from "@/app/actions/postActions";
import {
  firstSearchParam,
  ITEMS_PER_PAGE,
  parsePageParam,
} from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";
import type { PostStatus } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Quản lý Bài viết",
};

type AdminCommunityPageProps = {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
};

function parsePostStatus(value?: string): "all" | PostStatus {
  if (value === "published" || value === "draft") return value;
  return "all";
}

export default async function AdminCommunityPage({
  searchParams,
}: AdminCommunityPageProps) {
  const params = await searchParams;
  const search = firstSearchParam(params.search)?.trim() ?? "";
  const status = parsePostStatus(firstSearchParam(params.status));
  const result = await getAllPosts({
    page: parsePageParam(params.page),
    search: search || undefined,
    status,
  });
  redirectIfPageOutOfRange(
    "/admin/community",
    {
      page: params.page,
      search: search || undefined,
      status: status === "all" ? undefined : status,
    },
    parsePageParam(params.page),
    result.totalPages,
    result.count
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bài viết cộng đồng</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý bài viết trên trang cộng đồng.
        </p>
      </div>

      <PostManager posts={result.data} search={search} status={status} />
      <Pagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        totalItems={result.count}
        itemsPerPage={ITEMS_PER_PAGE}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PostCard } from "@/components/cards/PostCard";
import { CommunitySection } from "@/components/modules/CommunitySection";
import { fetchAllPosts, fetchCurrentUser } from "@/app/actions/dataActions";
import { getPostExcerpt } from "@/lib/utils/editorjs";
import { createMetadata } from "@/lib/utils/metadata";
import {
  COMMUNITY_ITEMS_PER_PAGE,
  parseCommunityTab,
  parsePageParam,
} from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Cộng đồng",
  description: "Chia sẻ, kết nối và truyền cảm hứng cùng nhau - CLB Chạy bộ CMC Global",
  url: "/community",
});

type CommunityPageProps = {
  searchParams: Promise<{ page?: string; tab?: string; search?: string }>;
};

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const params = await searchParams;
  const currentPage = parsePageParam(params.page);
  const tab = parseCommunityTab(params.tab);
  const search = params.search?.trim() ?? "";
  const { data: user } = await fetchCurrentUser();
  const isAdmin = user?.role === "admin";
  const result = await fetchAllPosts(isAdmin, currentPage, tab, search);
  redirectIfPageOutOfRange(
    "/community",
    { page: params.page, tab: params.tab, search: search || undefined },
    currentPage,
    result.totalPages,
    result.count
  );

  return (
    <Section title="Cộng đồng" subtitle="Chia sẻ, kết nối và truyền cảm hứng cùng nhau">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Cộng đồng" }]}
        className="mb-8"
      />
      {result.error ? (
        <p className="text-center text-destructive">{result.error}</p>
      ) : (
        <Suspense fallback={null}>
        <CommunitySection
          posts={result.data}
          tab={tab}
          currentPage={result.currentPage}
          totalPages={result.totalPages}
          totalItems={result.count}
          itemsPerPage={COMMUNITY_ITEMS_PER_PAGE}
          search={search}
        >
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {result.data.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  excerpt={getPostExcerpt(post.content)}
                  priority={index === 0}
                />
              ))}
            </div>
        </CommunitySection>
        </Suspense>
      )}
    </Section>
  );
}

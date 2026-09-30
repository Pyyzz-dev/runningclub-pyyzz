"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Pagination } from "@/components/common/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryFilters } from "@/lib/hooks/useQueryFilters";
import type { PostWithAuthorAndCount } from "@/lib/supabase/types";
import { ITEMS_PER_PAGE, type CommunityTab } from "@/lib/utils/pagination";
import { cn } from "@/lib/utils";

interface CommunitySectionProps {
  posts: PostWithAuthorAndCount[];
  tab: CommunityTab;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  className?: string;
  children: ReactNode;
}

function CommunitySectionInner({
  posts,
  tab,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = ITEMS_PER_PAGE,
  className,
  children,
}: CommunitySectionProps) {
  const { setFilters } = useQueryFilters();
  const [activeTab, setActiveTab] = useState<CommunityTab>(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextTab: CommunityTab = value === "featured" ? "featured" : "all";
          setActiveTab(nextTab);
          setFilters({ tab: nextTab === "featured" ? "featured" : null });
        }}
      >
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="featured">Nổi bật</TabsTrigger>
        </TabsList>
      </Tabs>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {tab === "featured"
            ? "Chưa có bài viết nổi bật."
            : "Chưa có bài viết nào."}
        </p>
      ) : (
        children
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}

export function CommunitySection(props: CommunitySectionProps) {
  return (
    <Suspense fallback={props.children}>
      <CommunitySectionInner {...props} />
    </Suspense>
  );
}

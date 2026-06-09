"use client";

import { useMemo, useState } from "react";
import { PostCard } from "@/components/cards/PostCard";
import { Pagination } from "@/components/common/Pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PostWithAuthorAndCount } from "@/lib/supabase/types";
import { isWithinDays } from "@/lib/format";
import { cn } from "@/lib/utils";

const POSTS_PER_PAGE = 9;

interface CommunitySectionProps {
  posts: PostWithAuthorAndCount[];
  className?: string;
}

function isFeaturedPost(post: PostWithAuthorAndCount): boolean {
  return (
    post.comment_count >= 3 ||
    isWithinDays(post.published_at ?? post.updated_at, 3)
  );
}

export function CommunitySection({ posts, className }: CommunitySectionProps) {
  const [tab, setTab] = useState<"all" | "featured">("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    if (tab === "featured") {
      return posts.filter(isFeaturedPost);
    }
    return posts;
  }, [posts, tab]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const handleTabChange = (value: string) => {
    setTab(value as "all" | "featured");
    setCurrentPage(1);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="featured">Nổi bật</TabsTrigger>
        </TabsList>
      </Tabs>

      {paginatedPosts.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          {tab === "featured"
            ? "Chưa có bài viết nổi bật."
            : "Chưa có bài viết nào."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedPosts.map((post, index) => (
            <PostCard key={post.id} post={post} priority={index === 0} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

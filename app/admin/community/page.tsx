import type { Metadata } from "next";
import { PostManager } from "@/components/admin/PostManager";
import { getAllPosts } from "@/app/actions/postActions";

export const metadata: Metadata = {
  title: "Quản lý Bài viết",
};

export default async function AdminCommunityPage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Bài viết cộng đồng</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý bài viết trên trang cộng đồng.
        </p>
      </div>

      <PostManager posts={posts} />
    </div>
  );
}

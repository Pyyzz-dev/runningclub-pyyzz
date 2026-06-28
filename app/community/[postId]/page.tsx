import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CommentSection } from "@/components/community/CommentSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchCurrentUser, fetchPostById } from "@/app/actions/dataActions";
import { formatPublishedAt } from "@/lib/format";
import { renderEditorContent } from "@/lib/utils/editorjs";

export const revalidate = 3600;

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const { data: post } = await fetchPostById(postId, false);
  return { title: post?.title ?? "Bài viết" };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const { data: user } = await fetchCurrentUser();
  const isAdmin = user?.role === "admin";
  const { data: post, error } = await fetchPostById(postId, isAdmin);

  if (error || !post) {
    notFound();
  }

  if (post.status !== "published") {
    notFound();
  }

  const initials = post.author.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const visibleCommentCount = post.comments.length;

  return (
    <Container className="section-padding">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Cộng đồng", href: "/community" },
          { label: post.title },
        ]}
        className="mb-8"
      />

      <article className="mx-auto max-w-3xl animate-fade-in">
        {post.cover_image_url && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-xl">
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span>{post.author.full_name}</span>
            </div>
            <span>•</span>
            <time dateTime={post.published_at ?? post.updated_at} suppressHydrationWarning>
              {formatPublishedAt(post.published_at ?? post.updated_at)}
            </time>
            <span>•</span>
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {visibleCommentCount} bình luận
            </Badge>
          </div>
        </header>

        <div
          className="prose prose-lg prose-slate max-w-none text-foreground dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: renderEditorContent(post.content),
          }}
        />

        <Separator className="my-10" />

        <CommentSection
          postId={post.id}
          comments={post.comments}
          isAdmin={isAdmin}
        />
      </article>
    </Container>
  );
}

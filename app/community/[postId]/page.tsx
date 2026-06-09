import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CommentForm } from "@/components/forms/CommentForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchPostById } from "@/app/actions/dataActions";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";

export const revalidate = 3600;

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const { data: post } = await fetchPostById(postId);
  return { title: post?.title ?? "Bài viết" };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const { data: post, error } = await fetchPostById(postId);

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
            <time dateTime={post.published_at ?? post.updated_at}>
              {formatRelativeTime(post.published_at ?? post.updated_at)}
            </time>
            <span>•</span>
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.comments.length} bình luận
            </Badge>
          </div>
        </header>

        <div
          className="prose prose-lg prose-slate max-w-none text-foreground dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{
            __html: cleanHtmlContent(post.content),
          }}
        />

        <Separator className="my-10" />

        <section>
          <h2 className="mb-6 font-display text-xl font-semibold">
            Bình luận ({post.comments.length})
          </h2>

          <CommentForm postId={post.id} className="mb-8" />

          <div className="space-y-4">
            {post.comments.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Chưa có bình luận. Hãy là người đầu tiên!
              </p>
            ) : (
              post.comments.map((comment) => {
                const commentInitials = comment.display_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={comment.id}
                    className="flex gap-3 rounded-lg border bg-card p-4 animate-slide-up"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      {!comment.is_anonymous && (
                        <AvatarImage src={comment.author.avatar_url ?? undefined} />
                      )}
                      <AvatarFallback>{commentInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{comment.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at, "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </article>
    </Container>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/common/Container";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { CommentSection } from "@/components/community/CommentSection";
import { CommentsSkeleton, PostSkeleton } from "@/components/skeletons/PostSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  fetchCurrentUser,
  fetchPostComments,
  fetchPostDetail,
} from "@/app/actions/dataActions";
import { formatPublishedAt } from "@/lib/format";
import { CLUB_DESCRIPTION, CLUB_NAME, getSiteUrl } from "@/lib/site-config";
import { getPostExcerpt, renderEditorContent } from "@/lib/utils/editorjs";

export const revalidate = 300;

type PostDetailPageProps = {
  params: Promise<{ postId: string }>;
};

const FALLBACK_OG_IMAGE = "/logo_runningclub_wb_512x512.png";

function toOgImageUrl(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  const queryIndex = trimmed.indexOf("?");
  const path = queryIndex === -1 ? trimmed : trimmed.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : trimmed.slice(queryIndex);
  return `${path.replaceAll("&", "%26")}${query}`;
}

export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { postId } = await params;
  const { data: post } = await fetchPostDetail(postId);

  if (!post || post.status !== "published") {
    return { title: "Bài viết không tồn tại" };
  }

  const excerpt = getPostExcerpt(post.content, 160) || CLUB_DESCRIPTION;
  const siteUrl = getSiteUrl();
  const postUrl = `${siteUrl}/community/${postId}`;
  const coverUrl = toOgImageUrl(post.cover_image_url);
  const image =
    coverUrl && /^https?:\/\//i.test(coverUrl)
      ? {
          url: coverUrl,
          width: 1200,
          height: 675,
          alt: post.title,
        }
      : {
          url: FALLBACK_OG_IMAGE,
          width: 512,
          height: 512,
          alt: CLUB_NAME,
        };

  return {
    title: post.title,
    description: excerpt,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: excerpt,
      url: postUrl,
      siteName: CLUB_NAME,
      images: [image],
      locale: "vi_VN",
      type: "article",
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
      images: [image.url],
    },
  };
}

async function CommentsBlock({ postId }: { postId: string }) {
  const { data: user } = await fetchCurrentUser();
  const isAdmin = user?.role === "admin";
  const { data: comments } = await fetchPostComments(postId, isAdmin);

  return (
    <CommentSection
      postId={postId}
      comments={comments ?? []}
      isAdmin={isAdmin}
    />
  );
}

async function PostContent({ postId }: { postId: string }) {
  const { data: post, error } = await fetchPostDetail(postId);

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
            {post.cover_image_url.includes("unsplash.com") ||
            post.cover_image_url.includes("image.pollinations.ai") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            )}
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

        <Suspense fallback={<CommentsSkeleton />}>
          <CommentsBlock postId={post.id} />
        </Suspense>
      </article>
    </Container>
  );
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostDetail params={params} />
    </Suspense>
  );
}

async function PostDetail({ params }: PostDetailPageProps) {
  const { postId } = await params;
  return <PostContent postId={postId} />;
}

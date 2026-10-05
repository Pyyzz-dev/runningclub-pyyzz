import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { fetchCurrentUser, fetchHistoryEventById } from "@/app/actions/dataActions";
import { getHistoryComments } from "@/app/actions/historyCommentActions";
import { HistoryCommentSection } from "@/components/history/HistoryCommentSection";
import { CommentsSkeleton } from "@/components/skeletons/PostSkeleton";
import { formatDate } from "@/lib/format";
import { renderEditorContent } from "@/lib/utils/editorjs";
import { createExcerpt, createMetadata } from "@/lib/utils/metadata";
import { HistoryEventSkeleton } from "./loading";

export const revalidate = 300;

type HistoryEventPageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: HistoryEventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const { data: event } = await fetchHistoryEventById(eventId);

  if (!event) {
    return { title: "Không tìm thấy mốc lịch sử" };
  }

  return createMetadata({
    title: event.title,
    description: createExcerpt(event.content, 160),
    image: event.image_url,
    url: `/history/${eventId}`,
    type: "article",
    publishedTime: event.event_date,
  });
}

async function CommentsBlock({ historyId }: { historyId: string }) {
  const [{ data: user }, comments] = await Promise.all([
    fetchCurrentUser(),
    getHistoryComments(historyId),
  ]);

  return (
    <HistoryCommentSection
      historyId={historyId}
      comments={comments}
      isAdmin={user?.role === "admin"}
      currentUserId={user?.id ?? null}
    />
  );
}

async function HistoryContent({ eventId }: { eventId: string }) {
  const { data: event, error } = await fetchHistoryEventById(eventId);

  if (error || !event) {
    notFound();
  }

  return (
    <Container className="section-padding">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Phòng truyền thống", href: "/history" },
          { label: event.title },
        ]}
        className="mb-8"
      />

      <Button asChild variant="ghost" className="mb-6 -ml-2 gap-2 text-muted-foreground">
        <Link href="/history">
          <ArrowLeft className="h-4 w-4" />
          Quay lại lịch sử CLB
        </Link>
      </Button>

      <article className="mx-auto max-w-3xl animate-fade-in">
        <time className="text-sm text-muted-foreground">{formatDate(event.event_date)}</time>

        <h1 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">
          {event.title}
        </h1>

        {event.image_url && (
          <div className="relative mt-6 aspect-video overflow-hidden rounded-xl">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div
          className="prose prose-lg prose-slate mt-8 max-w-none text-foreground dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: renderEditorContent(event.content) }}
        />

        <div className="mt-12 border-t pt-8">
          <Suspense fallback={<CommentsSkeleton />}>
            <CommentsBlock historyId={event.id} />
          </Suspense>
        </div>
      </article>
    </Container>
  );
}

export default function HistoryEventPage({ params }: HistoryEventPageProps) {
  return (
    <Suspense fallback={<HistoryEventSkeleton />}>
      <HistoryEvent params={params} />
    </Suspense>
  );
}

async function HistoryEvent({ params }: HistoryEventPageProps) {
  const { eventId } = await params;
  return <HistoryContent eventId={eventId} />;
}

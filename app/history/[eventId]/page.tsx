import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { fetchHistoryEventById } from "@/app/actions/dataActions";
import { formatPublishedAt } from "@/lib/format";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";

export const revalidate = 3600;

type HistoryEventPageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: HistoryEventPageProps): Promise<Metadata> {
  const { eventId } = await params;
  const { data: event } = await fetchHistoryEventById(eventId);
  return { title: event?.title ?? "Sự kiện lịch sử" };
}

export default async function HistoryEventPage({ params }: HistoryEventPageProps) {
  const { eventId } = await params;
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
        <time className="text-sm text-muted-foreground">{formatPublishedAt(event.event_date)}</time>

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
          dangerouslySetInnerHTML={{ __html: cleanHtmlContent(event.content) }}
        />
      </article>
    </Container>
  );
}

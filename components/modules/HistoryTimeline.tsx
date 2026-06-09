"use client";

import { formatDate } from "@/lib/format";
import type { ClubHistory } from "@/lib/supabase/types";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface HistoryTimelineProps {
  items: ClubHistory[];
  className?: string;
}

export function HistoryTimeline({ items, className }: HistoryTimelineProps) {
  const sortedItems = [...items].sort(
    (a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  if (sortedItems.length === 0) {
    return (
      <p className={cn("py-12 text-center text-muted-foreground", className)}>
        Chưa có dữ liệu lịch sử.
      </p>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-px" />

      <div className="space-y-8">
        {sortedItems.map((item, index) => {
          const isEven = index % 2 === 0;

          return (
            <div
              key={item.id}
              className={cn(
                "relative flex flex-col gap-4 md:flex-row md:items-start",
                isEven ? "md:flex-row-reverse" : ""
              )}
            >
              <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-primary bg-background md:left-1/2" />

              <div className="hidden flex-1 md:block" />

              <div
                className={cn(
                  "ml-10 flex-1 rounded-lg border bg-card p-6 shadow-sm md:ml-0",
                  isEven ? "md:text-right" : ""
                )}
              >
                <time className="text-sm font-medium text-primary">
                  {formatDate(item.event_date, "dd/MM/yyyy")}
                </time>
                <h3 className="mt-1 font-display text-lg font-semibold">
                  {item.title}
                </h3>
                <div
                  className="prose prose-sm mt-2 max-w-none text-muted-foreground dark:prose-invert [&_img]:max-w-full [&_img]:rounded-md"
                  dangerouslySetInnerHTML={{ __html: cleanHtmlContent(item.content) }}
                />
                {item.image_url && (
                  <div
                    className={cn(
                      "relative mt-4 aspect-video overflow-hidden rounded-md",
                      isEven ? "md:ml-auto" : ""
                    )}
                  >
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

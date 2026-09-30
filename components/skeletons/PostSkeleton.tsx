import { Container } from "@/components/common/Container";
import { Skeleton } from "@/components/ui/skeleton";

export function CommentsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

export function PostSkeleton() {
  return (
    <Container className="section-padding">
      <div className="mx-auto max-w-3xl space-y-6" role="status" aria-label="Đang tải bài viết">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-10 w-4/5" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <CommentsSkeleton />
      </div>
    </Container>
  );
}

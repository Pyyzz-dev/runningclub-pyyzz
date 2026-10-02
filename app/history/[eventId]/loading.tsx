import { Container } from "@/components/common/Container";
import { Skeleton } from "@/components/ui/skeleton";

export function HistoryEventSkeleton() {
  return (
    <Container className="section-padding">
      <div
        className="mx-auto max-w-3xl space-y-4"
        role="status"
        aria-label="Đang tải mốc lịch sử"
      >
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </Container>
  );
}

export default function Loading() {
  return <HistoryEventSkeleton />;
}

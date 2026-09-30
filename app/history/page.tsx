import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { fetchHistoryTimelinePaginated } from "@/app/actions/dataActions";
import { ITEMS_PER_PAGE, parsePageParam } from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Phòng truyền thống",
};

type HistoryPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const { page } = await searchParams;
  const currentPage = parsePageParam(page);
  const result = await fetchHistoryTimelinePaginated(currentPage);
  redirectIfPageOutOfRange(
    "/history",
    { page },
    currentPage,
    result.totalPages,
    result.count
  );

  const listItems =
    result.data.map(({ id, title, event_date }) => ({ id, title, event_date }));

  return (
    <>
      <div className="container-custom pt-6">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Phòng truyền thống" },
          ]}
        />
      </div>

      <Section
        title="Phòng truyền thống"
        subtitle="Hành trình phát triển của CLB qua các năm"
        className="!pt-4"
      >
        {result.error ? (
          <p className="text-center text-destructive">{result.error}</p>
        ) : (
          <>
            <HistoryTimeline items={listItems} />
            <Pagination
              currentPage={result.currentPage}
              totalPages={result.totalPages}
              totalItems={result.count}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { Section } from "@/components/common/Section";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EventSearchBar } from "@/components/events/EventSearchBar";
import { EventList } from "@/components/modules/EventList";
import { Pagination } from "@/components/common/Pagination";
import {
  fetchCurrentUser,
  fetchEventYears,
  fetchUpcomingEventsPaginated,
} from "@/app/actions/dataActions";
import { getUserEventParticipations } from "@/app/actions/eventParticipantActions";
import { ITEMS_PER_PAGE, parsePageParam } from "@/lib/utils/pagination";
import { redirectIfPageOutOfRange } from "@/lib/utils/pagination-redirect";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sự kiện",
};

type EventsPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    year?: string;
    month?: string;
  }>;
};

function parseYear(value?: string) {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return undefined;
  return year;
}

function parseMonth(value?: string) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return undefined;
  return month;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const {
    page,
    search = "",
    year = "",
    month = "",
  } = await searchParams;
  const trimmedSearch = search.trim();
  const parsedYear = parseYear(year);
  const parsedMonth = parseMonth(month);
  const hasFilters = Boolean(trimmedSearch || parsedYear || parsedMonth);
  const currentPage = parsePageParam(page);

  const [eventsResult, { data: user }, availableYears] = await Promise.all([
    fetchUpcomingEventsPaginated(currentPage, {
      search: trimmedSearch || undefined,
      year: parsedYear,
      month: parsedMonth,
    }),
    fetchCurrentUser(),
    fetchEventYears(),
  ]);

  redirectIfPageOutOfRange(
    "/events",
    { page, search: trimmedSearch || undefined, year, month },
    currentPage,
    eventsResult.totalPages,
    eventsResult.count
  );

  const joinedMap = user ? await getUserEventParticipations(user.id) : {};

  return (
    <Section title="Sự kiện" subtitle="Các giải chạy và hoạt động sắp diễn ra">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Sự kiện" }]}
        className="mb-8"
      />
      <AuthGuard message="Hãy đăng ký tài khoản và trở thành thành viên CLB để theo dõi lịch sự kiện của CLB">
        <EventSearchBar
          filters={{
            search: trimmedSearch,
            year: parsedYear ? String(parsedYear) : "",
            month: parsedMonth ? String(parsedMonth) : "",
          }}
          availableYears={availableYears}
        />
        {eventsResult.error ? (
          <p className="text-center text-destructive">{eventsResult.error}</p>
        ) : (
          <>
            <EventList
              events={eventsResult.data}
              userId={user?.id ?? null}
              joinedMap={joinedMap}
              enableParticipation
              searchTerm={trimmedSearch}
              hasFilters={hasFilters}
            />
            <Pagination
              currentPage={eventsResult.currentPage}
              totalPages={eventsResult.totalPages}
              totalItems={eventsResult.count}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </>
        )}
      </AuthGuard>
    </Section>
  );
}

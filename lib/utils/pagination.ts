export const ITEMS_PER_PAGE = 10;
export const COMMUNITY_ITEMS_PER_PAGE = 9;

export type CommunityTab = "all" | "featured";

export type PaginatedResult<T> = {
  data: T[];
  count: number;
  currentPage: number;
  totalPages: number;
  error: string | null;
};

export function isUnsatisfiableRangeError(
  error: { code?: string; message: string } | null | undefined
): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST103" ||
    /requested range not satisfiable/i.test(error.message)
  );
}

export function firstSearchParam(
  value?: string | string[]
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePageParam(value?: string | string[]): number {
  const raw = firstSearchParam(value);
  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export function getPaginationRange(
  page: number,
  itemsPerPage: number = ITEMS_PER_PAGE
) {
  const currentPage = Math.max(1, page || 1);
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;
  return { from, to, currentPage };
}

export function getTotalPages(
  total: number,
  itemsPerPage: number = ITEMS_PER_PAGE
): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / itemsPerPage));
}

export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export function parseCommunityTab(value?: string | string[]): CommunityTab {
  return firstSearchParam(value) === "featured" ? "featured" : "all";
}

export function emptyPaginated<T>(
  page = 1,
  error: string | null = null
): PaginatedResult<T> {
  return {
    data: [],
    count: 0,
    currentPage: Math.max(1, page),
    totalPages: 1,
    error,
  };
}

export function toPaginatedResult<T>(
  data: T[] | null,
  count: number | null,
  page: number,
  error: string | null,
  itemsPerPage: number = ITEMS_PER_PAGE
): PaginatedResult<T> {
  const total = count ?? 0;
  return {
    data: data ?? [],
    count: total,
    currentPage: Math.max(1, page),
    totalPages: getTotalPages(total, itemsPerPage),
    error,
  };
}

export function slicePage<T>(
  items: T[],
  page: number,
  itemsPerPage: number = ITEMS_PER_PAGE
) {
  const { from, to, currentPage } = getPaginationRange(page, itemsPerPage);
  return {
    items: items.slice(from, to + 1),
    currentPage,
    totalPages: getTotalPages(items.length, itemsPerPage),
    totalItems: items.length,
  };
}

export function replaceQueryParams(
  pathname: string,
  current: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const params = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

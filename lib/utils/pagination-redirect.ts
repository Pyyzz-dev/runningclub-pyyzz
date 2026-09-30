import { redirect } from "next/navigation";

export function redirectIfPageOutOfRange(
  pathname: string,
  params: Record<string, string | undefined>,
  currentPage: number,
  totalPages: number,
  totalItems: number
) {
  if (!(totalItems > 0 && currentPage > totalPages)) return;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || !value) continue;
    search.set(key, value);
  }
  if (totalPages > 1) {
    search.set("page", String(totalPages));
  }

  const query = search.toString();
  redirect(query ? `${pathname}?${query}` : pathname);
}

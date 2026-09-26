"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface EventFilters {
  search: string;
  year: string;
  month: string;
}

interface EventSearchBarProps {
  filters: EventFilters;
  availableYears: number[];
}

function buildEventsQuery(filters: EventFilters) {
  const params = new URLSearchParams();
  const search = filters.search.trim();
  if (search) params.set("search", search);
  if (filters.year) params.set("year", filters.year);
  if (filters.month) params.set("month", filters.month);
  return params.toString();
}

export function EventSearchBar({ filters, availableYears }: EventSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const filtersRef = useRef(filters);
  const pathnameRef = useRef(pathname);

  filtersRef.current = filters;
  pathnameRef.current = pathname;

  useEffect(() => {
    setSearchTerm(filters.search);
  }, [filters.search]);

  const pushFilters = useCallback(
    (next: EventFilters, targetPath = pathname) => {
      const query = buildEventsQuery(next);
      router.replace(query ? `${targetPath}?${query}` : targetPath);
    },
    [pathname, router]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = filtersRef.current;
      if (searchTerm.trim() === current.search.trim()) return;
      pushFilters({ ...current, search: searchTerm }, pathnameRef.current);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchTerm, pushFilters]);

  const hasFilters = Boolean(searchTerm.trim() || filters.year || filters.month);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[180px] max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sự kiện..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          aria-label="Tìm kiếm sự kiện"
        />
      </div>

      <select
        value={filters.year}
        onChange={(e) => pushFilters({ ...filters, search: searchTerm, year: e.target.value })}
        className="h-10 min-w-[120px] rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Lọc theo năm"
      >
        <option value="">Tất cả năm</option>
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>

      <select
        value={filters.month}
        onChange={(e) => pushFilters({ ...filters, search: searchTerm, month: e.target.value })}
        className="h-10 min-w-[120px] rounded-md border border-input bg-background px-3 text-sm"
        aria-label="Lọc theo tháng"
      >
        <option value="">Tất cả tháng</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <option key={month} value={month}>
            Tháng {month}
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearchTerm("");
            router.replace(pathname);
          }}
          className="text-sm"
        >
          <X className="mr-1 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}

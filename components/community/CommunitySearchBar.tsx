"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CommunitySearchBarProps {
  initialSearch?: string;
}

export function CommunitySearchBar({ initialSearch = "" }: CommunitySearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const appliedSearch = useRef(initialSearch.trim());

  useEffect(() => {
    setSearchInput(initialSearch);
    appliedSearch.current = initialSearch.trim();
  }, [initialSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === appliedSearch.current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("search", next);
      } else {
        params.delete("search");
      }
      params.delete("page");
      appliedSearch.current = next;

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchInput, pathname, router, searchParams]);

  const handleClear = () => {
    setSearchInput("");
    if (!appliedSearch.current) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    appliedSearch.current = "";
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm bài viết theo tiêu đề..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Tìm kiếm bài viết theo tiêu đề"
        />
        {searchInput ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {initialSearch ? (
        <p className="text-sm text-muted-foreground">
          Kết quả cho: <strong>&quot;{initialSearch}&quot;</strong>
        </p>
      ) : null}
    </div>
  );
}

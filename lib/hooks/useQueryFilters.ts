"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceQueryParams } from "@/lib/utils/pagination";

export function useQueryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilters = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      router.replace(
        replaceQueryParams(pathname, searchParams, {
          ...updates,
          ...(resetPage ? { page: null } : {}),
        })
      );
    },
    [pathname, router, searchParams]
  );

  return { setFilters };
}

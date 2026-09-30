"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { replaceQueryParams } from "@/lib/utils/pagination";
import { cn } from "@/lib/utils";

interface QuerySearchInputProps {
  value: string;
  paramName?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

function QuerySearchInputControl({
  value,
  paramName = "search",
  placeholder = "Tìm kiếm...",
  className,
  inputClassName,
}: QuerySearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(value);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (term.trim() === value.trim()) return;

      router.replace(
        replaceQueryParams(pathname, searchParams, {
          [paramName]: term.trim() || null,
          page: null,
        })
      );
    }, 400);

    return () => clearTimeout(timeout);
  }, [term, value, paramName, pathname, router, searchParams]);

  return (
    <div className={cn("relative max-w-sm flex-1", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={placeholder}
        className={cn("pl-9", inputClassName)}
        aria-label={placeholder}
      />
    </div>
  );
}

export function QuerySearchInput(props: QuerySearchInputProps) {
  return (
    <Suspense
      fallback={
        <div className={cn("relative max-w-sm flex-1", props.className)}>
          <Input
            defaultValue={props.value}
            placeholder={props.placeholder}
            className="pl-9"
            disabled
          />
        </div>
      }
    >
      <QuerySearchInputControl {...props} />
    </Suspense>
  );
}

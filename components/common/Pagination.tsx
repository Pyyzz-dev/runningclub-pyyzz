"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ITEMS_PER_PAGE, replaceQueryParams } from "@/lib/utils/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  itemLabel?: string;
  onPageChange?: (page: number) => void;
  className?: string;
}

function getVisiblePages(current: number, total: number): number[] {
  const windowSize = Math.min(5, total);

  return Array.from({ length: windowSize }, (_, i) => {
    if (total <= 5) return i + 1;
    if (current <= 3) return i + 1;
    if (current >= total - 2) return total - 4 + i;
    return current - 2 + i;
  });
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = ITEMS_PER_PAGE,
  itemLabel,
  onPageChange,
  className,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1 || totalItems <= 0) return null;

  const buildUrl = (page: number) =>
    replaceQueryParams(pathname, searchParams, {
      page: page <= 1 ? null : String(page),
    });

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = getVisiblePages(currentPage, totalPages);

  const goToPage = (page: number, disabled: boolean) => {
    if (disabled) return;
    onPageChange?.(page);
  };

  return (
    <nav
      aria-label="Phân trang"
      className={cn(
        "flex items-center justify-between flex-wrap gap-2 pt-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> /{" "}
        <strong>{totalItems}</strong>
        {itemLabel ? ` ${itemLabel}` : ""}
      </p>

      <div className="flex items-center gap-1">
        <PaginationButton
          href={buildUrl(currentPage - 1)}
          disabled={currentPage <= 1}
          onClick={
            onPageChange
              ? () => goToPage(currentPage - 1, currentPage <= 1)
              : undefined
          }
          className="h-8 px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Trước</span>
        </PaginationButton>

        {pages.map((pageNum) => (
          <PaginationButton
            key={pageNum}
            href={buildUrl(pageNum)}
            disabled={false}
            onClick={onPageChange ? () => goToPage(pageNum, false) : undefined}
            className={cn(
              "h-8 w-8",
              currentPage === pageNum && "bg-blue-600 hover:bg-blue-700"
            )}
            variant={currentPage === pageNum ? "default" : "outline"}
            ariaCurrent={currentPage === pageNum ? "page" : undefined}
            ariaLabel={`Trang ${pageNum}`}
          >
            {pageNum}
          </PaginationButton>
        ))}

        <PaginationButton
          href={buildUrl(currentPage + 1)}
          disabled={currentPage >= totalPages}
          onClick={
            onPageChange
              ? () => goToPage(currentPage + 1, currentPage >= totalPages)
              : undefined
          }
          className="h-8 px-3"
        >
          <span className="mr-1 hidden sm:inline">Sau</span>
          <ChevronRight className="h-4 w-4" />
        </PaginationButton>
      </div>
    </nav>
  );
}

function PaginationButton({
  href,
  disabled,
  onClick,
  className,
  children,
  variant = "outline",
  ariaCurrent,
  ariaLabel,
}: {
  href: string;
  disabled: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
  variant?: "default" | "outline";
  ariaCurrent?: "page";
  ariaLabel?: string;
}) {
  if (disabled || onClick) {
    return (
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={disabled}
        onClick={onClick}
        className={className}
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button variant={variant} size="sm" className={className} asChild>
      <Link href={href} aria-current={ariaCurrent} aria-label={ariaLabel}>
        {children}
      </Link>
    </Button>
  );
}

export function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationControls {...props} />
    </Suspense>
  );
}

"use client";

import { cn } from "@/lib/utils";

interface YearTimelineProps {
  years: number[];
  onYearClick: (year: number) => void;
  activeYear?: number | null;
}

export function YearTimeline({ years, onYearClick, activeYear }: YearTimelineProps) {
  if (years.length === 0) return null;

  return (
    <nav
      aria-label="Điều hướng theo năm"
      className="my-6 flex flex-wrap items-center justify-center gap-y-2 border-y border-gray-200 py-6"
    >
      {years.map((year, index) => (
        <div key={year} className="flex items-center">
          <button
            type="button"
            onClick={() => onYearClick(year)}
            aria-current={activeYear === year ? "true" : undefined}
            className={cn(
              "text-base font-semibold transition-all duration-300 sm:text-lg",
              activeYear === year
                ? "scale-110 text-blue-600"
                : "text-gray-500 hover:text-blue-500"
            )}
          >
            {year}
          </button>
          {index < years.length - 1 && (
            <span
              className="mx-2 select-none text-lg text-gray-300 sm:mx-3 sm:text-xl"
              aria-hidden
            >
              ———
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

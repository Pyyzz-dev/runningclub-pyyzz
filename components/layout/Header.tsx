"use client";

import { CLUB_LOGO_URL, navLinks } from "@/components/layout/header-config";
import { HeaderAuthActions, HeaderMobileSheet } from "@/components/layout/HeaderControls";
import { isNavSegmentActive } from "@/lib/pathname";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

export function Header() {
  const segment = useSelectedLayoutSegment();

  if (segment === "admin") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container-custom py-3 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <HeaderMobileSheet segment={segment} />

            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Image
                src={CLUB_LOGO_URL}
                alt="CMC Global Running Club Logo"
                width={160}
                height={160}
                className="object-contain"
                priority
              />
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="font-display text-sm font-bold text-primary sm:text-base">
                  CLB Chạy bộ CMC Global
                </span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-4 md:flex lg:gap-6">
            {navLinks.map((link) => {
              const active = isNavSegmentActive(segment, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "whitespace-nowrap py-2 text-sm font-bold transition-colors lg:text-base",
                    active
                      ? "border-b-2 border-blue-600 font-bold text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <HeaderAuthActions />
        </div>
      </div>
    </header>
  );
}

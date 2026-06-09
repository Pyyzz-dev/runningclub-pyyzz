"use client";

import { CLUB_LOGO_URL, navLinks } from "@/components/layout/header-config";
import { HeaderActions, HeaderMobileMenu } from "@/components/layout/HeaderControls";
import { HeaderMobileProvider } from "@/components/layout/HeaderMobileContext";
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
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/95">
      <HeaderMobileProvider segment={segment}>
        <div className="container-custom py-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <Image
                src={CLUB_LOGO_URL}
                alt="CMC Global Running Club Logo"
                width={160}
                height={160}
                className="object-contain"
                priority
              />
              <span className="font-display hidden text-lg font-bold text-primary sm:inline sm:text-xl">
                Câu lạc bộ Chạy bộ CMC Global
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const active = isNavSegmentActive(segment, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      active
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <HeaderActions />
          </div>
          <HeaderMobileMenu />
        </div>
      </HeaderMobileProvider>
    </header>
  );
}

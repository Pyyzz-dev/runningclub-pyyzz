"use client";

import { adminNavItems } from "@/components/admin/admin-nav-config";
import { matchPath } from "@/lib/pathname";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminSidebarNavProps {
  pathname: string;
  onNavigate?: () => void;
}

export function AdminSidebarNav({ pathname, onNavigate }: AdminSidebarNavProps) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {adminNavItems.map(({ label, href, icon: Icon }) => {
        const active = matchPath(pathname, href, false);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { cn } from "@/lib/utils";
import {
  Calendar,
  LayoutDashboard,
  Medal,
  Newspaper,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bài viết", href: "/admin/posts", icon: Newspaper },
  { label: "Thành viên", href: "/admin/members", icon: Users },
  { label: "Bảng xếp hạng", href: "/admin/leaderboard", icon: Medal },
  { label: "Lịch tập", href: "/admin/schedule", icon: Calendar },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <aside
      className={cn(
        "flex w-full flex-col border-r bg-muted/20 md:w-64 md:shrink-0",
        className
      )}
    >
      <div className="border-b p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quản trị
        </h2>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {adminNavItems.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

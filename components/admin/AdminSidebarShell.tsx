"use client";

import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface AdminSidebarShellProps {
  pathname: string;
}

export function AdminSidebarShell({ pathname }: AdminSidebarShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-r bg-white px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-display font-semibold">Admin</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <span className="font-display font-semibold">CLB Admin</span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <AdminSidebarNav pathname={pathname} onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}

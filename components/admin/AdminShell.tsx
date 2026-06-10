import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getServerPathname } from "@/lib/server-pathname";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: ReactNode;
  title: string;
  className?: string;
}

export async function AdminShell({ children, title, className }: AdminShellProps) {
  const pathname = await getServerPathname();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 md:flex-row">
      <AdminSidebar pathname={pathname} className="hidden md:flex" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className={cn("admin-main w-full flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6", className)}>
          <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

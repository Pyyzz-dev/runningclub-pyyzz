import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarShell } from "@/components/admin/AdminSidebarShell";
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
    <div className="flex min-h-screen bg-background dark:bg-background">
      <AdminSidebarShell pathname={pathname} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className={cn("flex-1 p-4 md:p-6", className)}>
          <h1 className="mb-6 font-display text-2xl font-bold tracking-tight dark:text-foreground">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}

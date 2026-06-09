import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebarShell } from "@/components/admin/AdminSidebarShell";
import { getServerPathname } from "@/lib/server-pathname";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = await getServerPathname();

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebarShell pathname={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}

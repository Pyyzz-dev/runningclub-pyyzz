import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getServerPathname } from "@/lib/server-pathname";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = await getServerPathname();

  return (
    <AdminGuard>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 md:flex-row">
        <AdminSidebar pathname={pathname} className="hidden md:flex" />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="admin-main w-full flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}

import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  pathname: string;
  onItemClick?: () => void;
  className?: string;
}

export function AdminSidebar({ pathname, onItemClick, className }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r bg-white",
        className
      )}
    >
      <div className="flex h-14 shrink-0 items-center border-b px-4">
        <span className="font-display font-semibold">CLB Admin</span>
      </div>
      <AdminSidebarNav pathname={pathname} onNavigate={onItemClick} />
    </aside>
  );
}

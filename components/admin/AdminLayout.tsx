import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function AdminLayout({ children, title = "Quản trị", className }: AdminLayoutProps) {
  return (
    <div className={cn("flex min-h-[calc(100vh-4rem)]", className)}>
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-display text-lg font-semibold">{title}</h1>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

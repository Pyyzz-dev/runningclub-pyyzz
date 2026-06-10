"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { Home, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    setUser(null);
    toast.success("Đã đăng xuất");
    router.refresh();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 [&>button]:hidden">
            <SheetTitle className="sr-only">Menu quản trị</SheetTitle>
            <AdminSidebar
              pathname={pathname}
              onItemClick={() => setMenuOpen(false)}
              className="h-full w-full border-r-0"
            />
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          title="Quay lại trang chính"
        >
          <Home className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">Trang chính</span>
        </Link>

        <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        <p className="truncate text-sm font-semibold text-foreground sm:text-base">
          Quản trị hệ thống
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex shrink-0 items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
              {user?.full_name ?? "Admin"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Tài khoản admin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

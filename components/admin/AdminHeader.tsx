"use client";

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
import { createClient } from "@/lib/supabase/client";
import { Home, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminHeader() {
  const router = useRouter();
  const { user, setUser } = useAuth();

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          title="Quay lại trang chính"
        >
          <Home className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">Trang chính</span>
        </Link>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <p className="text-sm font-medium text-muted-foreground sm:text-base">
          Bảng quản trị
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">
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

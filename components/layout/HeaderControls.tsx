"use client";

import { navLinks } from "@/components/layout/header-config";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { isNavSegmentActive } from "@/lib/pathname";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function HeaderAuthActions() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
        return;
      }

      setUser(null);
      toast.success("Đã đăng xuất");
      router.refresh();
      router.push("/");
    });
  };

  if (user) {
    const displayName = user.full_name?.trim() || "Thành viên";

    return (
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 px-2 sm:gap-2 sm:px-3"
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="max-w-[100px] truncate text-sm sm:max-w-[150px]">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>{user.full_name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {user.role === "admin" ? "Quản trị viên" : "Thành viên"}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">
                <Shield className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              Hồ sơ
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button asChild variant="ghost" size="sm" className="px-2 text-sm sm:px-3">
        <Link href="/login">Đăng nhập</Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="bg-blue-600 px-2 text-sm text-white hover:bg-blue-700 sm:px-3"
      >
        <Link href="/register">Đăng ký</Link>
      </Button>
    </div>
  );
}

export function HeaderMobileSheet({ segment }: { segment: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2">
          {navLinks.map((link) => {
            const active = isNavSegmentActive(segment, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

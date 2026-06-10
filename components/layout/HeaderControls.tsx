"use client";

import { navLinks } from "@/components/layout/header-config";
import { useHeaderMobile } from "@/components/layout/HeaderMobileContext";
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
import { isNavSegmentActive } from "@/lib/pathname";
import { cn } from "@/lib/utils";
import { LogOut, Menu, Shield, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function HeaderActions() {
  const { user, setUser } = useAuth();
  const { mobileOpen, setMobileOpen } = useHeaderMobile();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

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

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="hidden gap-2 sm:inline-flex">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="max-w-[120px] truncate">{user.full_name}</span>
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
      ) : (
        <>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </div>
  );
}

export function HeaderMobileMenu() {
  const { user, setUser } = useAuth();
  const { mobileOpen, setMobileOpen, segment } = useHeaderMobile();
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
      setMobileOpen(false);
      toast.success("Đã đăng xuất");
      router.refresh();
      router.push("/");
    });
  };

  if (!mobileOpen) return null;

  return (
    <nav className="border-t py-4 lg:hidden">
      <ul className="flex flex-col gap-1">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isNavSegmentActive(segment, link.href)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}

        <li className="mt-2 border-t pt-3">
          {user ? (
            <div className="flex flex-col gap-2 px-3">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Quản trị viên" : "Thành viên"}
              </p>
              {user.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-primary"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="text-sm"
              >
                Hồ sơ
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="text-left text-sm text-destructive"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 px-3">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Đăng nhập
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Đăng ký
                </Link>
              </Button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}

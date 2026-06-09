"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { navLinks } from "@/components/layout/header-config";
import { useHeaderMobile } from "@/components/layout/HeaderMobileContext";
import { useAuth } from "@/components/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { LayoutDashboard, LogOut, Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function HeaderActions() {
  const { user, setUser } = useAuth();
  const { mobileOpen, setMobileOpen, loginOpen, setLoginOpen } = useHeaderMobile();
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
      router.push("/login");
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
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
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Bảng điều khiển
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
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
          <Button
            variant="default"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => setLoginOpen(true)}
          >
            Đăng nhập
          </Button>
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

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đăng nhập</DialogTitle>
            <DialogDescription>
              Đăng nhập để tham gia cộng đồng Câu lạc bộ Chạy bộ CMC Global
            </DialogDescription>
          </DialogHeader>
          <LoginForm onSuccess={() => setLoginOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HeaderMobileMenu() {
  const { user } = useAuth();
  const { mobileOpen, setMobileOpen, setLoginOpen, segment } = useHeaderMobile();

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
        {!user && (
          <li className="pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setMobileOpen(false);
                setLoginOpen(true);
              }}
            >
              Đăng nhập
            </Button>
          </li>
        )}
      </ul>
    </nav>
  );
}

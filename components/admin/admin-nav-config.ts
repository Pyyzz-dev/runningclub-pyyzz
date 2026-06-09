import { Calendar, Info, LayoutDashboard, Newspaper } from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Giới thiệu & Lịch sử", href: "/admin/club-info", icon: Info },
  { label: "Lịch tập", href: "/admin/training", icon: Calendar },
  { label: "Bài viết cộng đồng", href: "/admin/community", icon: Newspaper },
] as const;

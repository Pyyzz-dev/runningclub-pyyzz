import {
  Calendar,
  Info,
  LayoutDashboard,
  Newspaper,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Thành viên", href: "/admin/members", icon: Users },
  { label: "Duyệt thành viên", href: "/admin/members/pending", icon: UserCheck },
  { label: "Giới thiệu & Lịch sử", href: "/admin/club-info", icon: Info },
  { label: "Lịch tập", href: "/admin/training", icon: Calendar },
  { label: "Sự kiện", href: "/admin/events", icon: Trophy },
  { label: "Bài viết cộng đồng", href: "/admin/community", icon: Newspaper },
] as const;

export { CLUB_LOGO_URL } from "@/lib/site-config";

export const navLinks = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Lịch sử", href: "/history" },
  { label: "Lịch tập", href: "/training" },
  { label: "Sự kiện", href: "/events" },
  { label: "Cộng đồng", href: "/community" },
  { label: "Bảng xếp hạng", href: "/leaderboard" },
] as const;

export type NavLink = (typeof navLinks)[number];

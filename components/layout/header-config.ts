export const CLUB_LOGO_URL =
  "https://tlmzqwnvgcxhekljtrvg.supabase.co/storage/v1/object/public/Running%20Club%20-%20CMC%20Global/Image/logo_runningclub.jpg";

export const navLinks = [
  { label: "Giới thiệu", href: "/about" },
  { label: "Lịch sử", href: "/history" },
  { label: "Lịch tập", href: "/training" },
  { label: "Sự kiện", href: "/events" },
  { label: "Cộng đồng", href: "/community" },
  { label: "Bảng xếp hạng", href: "/leaderboard" },
] as const;

export type NavLink = (typeof navLinks)[number];

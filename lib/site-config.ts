export const CLUB_NAME = "Câu lạc bộ Chạy bộ CMC Global";

export const CLUB_DESCRIPTION =
  "Câu lạc bộ Chạy bộ CMC Global — cộng đồng runners năng động, lịch tập, sự kiện và bảng xếp hạng.";

export const CLUB_LOGO_URL =
  "https://tlmzqwnvgcxhekljtrvg.supabase.co/storage/v1/object/public/Running%20Club%20-%20CMC%20Global/Image/logo_runningclub.jpg";

const DEFAULT_SITE_URL = "https://runningclub-cmcglobal-ndp.vercel.app";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_SITE_URL;
  return raw.replace(/\/$/, "");
}

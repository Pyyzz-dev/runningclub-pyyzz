import { headers } from "next/headers";

/** Đọc pathname từ middleware — chỉ dùng trong Server Component */
export async function getServerPathname(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-pathname") ?? "";
}

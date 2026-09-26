import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Singleton — tránh tạo nhiều kết nối browser client */
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[supabase/client] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  supabaseInstance = createBrowserClient<Database>(url ?? "", anonKey ?? "");

  return supabaseInstance;
}

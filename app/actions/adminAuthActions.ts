"use server";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Chưa đăng nhập");
  }

  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || userData?.role !== "admin") {
    throw new Error("Không có quyền admin");
  }

  return user;
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

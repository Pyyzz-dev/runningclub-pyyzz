"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateOwnPassword as updateOwnPasswordHelper } from "@/lib/utils/db-helpers";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

const updatePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
});

/** Dùng cho form server-side (khuyến nghị dùng LoginForm client). */
export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { data: null, error: error.message };
  }

  const redirectTo = formData.get("redirect")?.toString() || "/dashboard";
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    oldPassword: formData.get("oldPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
    };
  }

  const result = await updateOwnPasswordHelper(
    parsed.data.oldPassword,
    parsed.data.newPassword
  );

  if (result.data) {
    revalidatePath("/dashboard");
    revalidatePath("/profile");
  }

  return result;
}

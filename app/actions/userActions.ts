"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  AVATARS_FOLDER,
  STORAGE_BUCKET_NAME,
  buildAvatarStoragePath,
} from "@/lib/supabase/storage-config";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils/db-helpers";

type ActionResult =
  | { success: true; message: string; url?: string | null }
  | { error: string };

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const avatarUrlSchema = z.string().url("URL avatar không hợp lệ").max(2000);

function revalidateAvatarSurfaces() {
  revalidatePath("/profile");
  revalidatePath("/", "layout");
}

async function removeOwnAvatarFiles(userId: string, keepFileName?: string) {
  const supabase = await createClient();
  const folder = `${AVATARS_FOLDER}/${userId}`;
  const { data: files, error } = await supabase.storage.from(STORAGE_BUCKET_NAME).list(folder);

  if (error) {
    console.error("[removeOwnAvatarFiles]", { message: error.message, userId });
    return;
  }

  const stale = (files ?? []).filter((file) => file.name !== keepFileName);
  if (stale.length === 0) return;

  const paths = stale.map((file) => `${folder}/${file.name}`);
  const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET_NAME).remove(paths);
  if (removeError) {
    console.error("[removeOwnAvatarFiles]", { message: removeError.message, userId });
  }
}

export async function updateAvatar(avatarUrl: string): Promise<ActionResult> {
  const { data: currentUser, error: userError } = await getCurrentUser();
  if (!currentUser) {
    return { error: userError ?? "Vui lòng đăng nhập" };
  }

  const parsed = avatarUrlSchema.safeParse(avatarUrl);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "URL avatar không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: parsed.data })
    .eq("id", currentUser.id);

  if (error) {
    console.error("[updateAvatar]", { message: error.message, userId: currentUser.id });
    return { error: "Không thể cập nhật avatar" };
  }

  revalidateAvatarSurfaces();
  return { success: true, message: "Cập nhật avatar thành công", url: parsed.data };
}

export async function uploadOwnAvatar(formData: FormData): Promise<ActionResult> {
  const { data: currentUser, error: userError } = await getCurrentUser();
  if (!currentUser) {
    return { error: userError ?? "Vui lòng đăng nhập" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "File không hợp lệ" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Ảnh không được vượt quá 10MB" };
  }

  const fileName = `avatar_${Date.now()}.jpg`;
  const path = buildAvatarStoragePath(currentUser.id, fileName);
  const supabase = await createClient();

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET_NAME)
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[uploadOwnAvatar]", { message: uploadError.message, userId: currentUser.id });
    return { error: "Upload avatar thất bại" };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(path);
  const updated = await updateAvatar(data.publicUrl);
  if ("error" in updated) {
    return updated;
  }

  await removeOwnAvatarFiles(currentUser.id, fileName);
  return { success: true, message: "Cập nhật avatar thành công", url: data.publicUrl };
}

export async function removeAvatar(): Promise<ActionResult> {
  const { data: currentUser, error: userError } = await getCurrentUser();
  if (!currentUser) {
    return { error: userError ?? "Vui lòng đăng nhập" };
  }

  await removeOwnAvatarFiles(currentUser.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", currentUser.id);

  if (error) {
    console.error("[removeAvatar]", { message: error.message, userId: currentUser.id });
    return { error: "Không thể xóa avatar" };
  }

  revalidateAvatarSurfaces();
  return { success: true, message: "Đã xóa avatar", url: null };
}

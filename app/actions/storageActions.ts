"use server";

import { requireAdmin } from "@/app/actions/adminAuthActions";
import {
  STORAGE_BUCKET_NAME,
  buildEventStoragePath,
  buildStoragePath,
  isStorageSubFolder,
  type StorageSubFolder,
} from "@/lib/supabase/storage-config";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getFolderFromForm(formData: FormData, defaultFolder = "introduce"): string {
  return String(formData.get("folder") ?? defaultFolder);
}

function generateSafeFileName(originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}_${safeName}`;
}

function resolveUploadPath(folder: string, fileName: string): string {
  if (folder === "events") {
    return buildEventStoragePath(fileName);
  }

  return buildStoragePath(
    isStorageSubFolder(folder) ? folder : ("introduce" satisfies StorageSubFolder),
    fileName
  );
}

export async function uploadImage(formData: FormData) {
  const folder = getFolderFromForm(formData);
  const isCommentUpload = folder === "history-comments";

  if (isCommentUpload) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: "Vui lòng đăng nhập để tải ảnh" };
    }
  } else {
    try {
      await requireAdmin();
    } catch (e) {
      return {
        success: false as const,
        error: e instanceof Error ? e.message : "Không có quyền",
      };
    }
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "File không hợp lệ" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false as const, error: "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, GIF" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { success: false as const, error: "Ảnh không được vượt quá 10MB" };
  }

  const path = resolveUploadPath(folder, generateSafeFileName(file.name));
  const supabase = isCommentUpload ? createAdminClient() : await createClient();
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET_NAME)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    return { success: false as const, error: uploadError.message };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(path);
  return { success: true as const, url: data.publicUrl };
}

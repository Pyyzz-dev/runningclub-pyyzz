"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/utils/db-helpers";
import type { HistoryCommentWithAuthor } from "@/lib/supabase/types";

const ANONYMOUS_DISPLAY_NAME = "Thành viên ẩn danh";

type ActionResult =
  | { success: true; message: string }
  | { error: string };

const addSchema = z
  .object({
    historyId: z.string().uuid("Mốc lịch sử không hợp lệ"),
    content: z.string().trim(),
    imageUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null)),
    isAnonymous: z.boolean().default(false),
  })
  .refine((data) => data.content.length > 0 || Boolean(data.imageUrl), {
    message: "Vui lòng nhập nội dung hoặc chèn ảnh",
  });

function mapComment(row: {
  id: string;
  history_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  is_anonymous: boolean;
  created_at: string;
  users: { id: string; full_name: string; avatar_url: string | null } | null;
}): HistoryCommentWithAuthor {
  const author = row.users ?? {
    id: row.user_id,
    full_name: "",
    avatar_url: null,
  };

  return {
    id: row.id,
    history_id: row.history_id,
    user_id: row.user_id,
    content: row.content,
    image_url: row.image_url,
    is_anonymous: row.is_anonymous,
    created_at: row.created_at,
    author,
    display_name: row.is_anonymous ? ANONYMOUS_DISPLAY_NAME : author.full_name,
  };
}

export async function getHistoryComments(
  historyId: string
): Promise<HistoryCommentWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("history_comments")
    .select(
      `
      id,
      history_id,
      user_id,
      content,
      image_url,
      is_anonymous,
      created_at,
      users (id, full_name, avatar_url)
    `
    )
    .eq("history_id", historyId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getHistoryComments]", error?.message);
    return [];
  }

  return data.map((row) =>
    mapComment(
      row as {
        id: string;
        history_id: string;
        user_id: string;
        content: string;
        image_url: string | null;
        is_anonymous: boolean;
        created_at: string;
        users: { id: string; full_name: string; avatar_url: string | null } | null;
      }
    )
  );
}

export async function addHistoryComment(formData: FormData): Promise<ActionResult> {
  const { data: currentUser, error: userError } = await getCurrentUser();
  if (!currentUser) {
    return { error: userError ?? "Vui lòng đăng nhập để bình luận" };
  }

  const parsed = addSchema.safeParse({
    historyId: formData.get("history_id"),
    content: String(formData.get("content") ?? ""),
    imageUrl: String(formData.get("image_url") ?? ""),
    isAnonymous: formData.get("is_anonymous") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("history_comments").insert({
    history_id: parsed.data.historyId,
    user_id: currentUser.id,
    content: parsed.data.content,
    image_url: parsed.data.imageUrl,
    is_anonymous: parsed.data.isAnonymous,
  });

  if (error) {
    console.error("[addHistoryComment]", error.message);
    return { error: "Không thể gửi bình luận" };
  }

  revalidatePath(`/history/${parsed.data.historyId}`);
  return { success: true, message: "Đã gửi bình luận" };
}

export async function deleteHistoryComment(
  commentId: string,
  historyId: string
): Promise<ActionResult> {
  const { data: currentUser, error: userError } = await getCurrentUser();
  if (!currentUser) {
    return { error: userError ?? "Vui lòng đăng nhập" };
  }

  const supabase = await createClient();
  const { data: comment, error: fetchError } = await supabase
    .from("history_comments")
    .select("user_id")
    .eq("id", commentId)
    .maybeSingle();

  if (fetchError || !comment) {
    return { error: "Không tìm thấy bình luận" };
  }

  if (comment.user_id !== currentUser.id && currentUser.role !== "admin") {
    return { error: "Bạn không có quyền xóa bình luận này" };
  }

  const { error } = await supabase.from("history_comments").delete().eq("id", commentId);
  if (error) {
    console.error("[deleteHistoryComment]", error.message);
    return { error: "Không thể xóa bình luận" };
  }

  revalidatePath(`/history/${historyId}`);
  return { success: true, message: "Đã xóa bình luận" };
}

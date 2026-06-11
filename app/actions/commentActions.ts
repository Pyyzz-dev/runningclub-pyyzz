"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import { addComment as addCommentHelper, getCurrentUser } from "@/lib/utils/db-helpers";

type AdminCommentResult =
  | { success: true; message: string }
  | { success: false; error: string };

const commentSchema = z.object({
  postId: z.string().uuid("Post ID không hợp lệ"),
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  isAnonymous: z.boolean().default(false),
});

function revalidatePostComments(postId: string) {
  revalidatePath(`/community/${postId}`);
}

export async function addComment(formData: FormData) {
  const { data: currentUser, error: userError } = await getCurrentUser();

  if (!currentUser) {
    return { data: null, error: userError ?? "Chưa đăng nhập" };
  }

  const parsed = commentSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
    isAnonymous: formData.get("isAnonymous") === "true",
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const result = await addCommentHelper(
    parsed.data.postId,
    currentUser.id,
    parsed.data.content,
    parsed.data.isAnonymous
  );

  if (result.data) {
    revalidatePostComments(parsed.data.postId);
  }

  return result;
}

export async function hideComment(
  commentId: string,
  postId: string
): Promise<AdminCommentResult> {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không có quyền admin";
    return { success: false, error: message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: true })
    .eq("id", commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePostComments(postId);
  return { success: true, message: "Đã ẩn bình luận" };
}

export async function restoreComment(
  commentId: string,
  postId: string
): Promise<AdminCommentResult> {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không có quyền admin";
    return { success: false, error: message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ is_hidden: false })
    .eq("id", commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePostComments(postId);
  return { success: true, message: "Đã hiện lại bình luận" };
}

export async function deleteCommentPermanently(
  commentId: string,
  postId: string
): Promise<AdminCommentResult> {
  try {
    await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không có quyền admin";
    return { success: false, error: message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePostComments(postId);
  return { success: true, message: "Đã xóa vĩnh viễn bình luận" };
}

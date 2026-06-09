"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addComment as addCommentHelper,
  deleteComment as deleteCommentHelper,
  getCurrentUser,
} from "@/lib/utils/db-helpers";

const commentSchema = z.object({
  postId: z.string().uuid("Post ID không hợp lệ"),
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  isAnonymous: z.boolean().default(false),
});

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
    revalidatePath(`/community/${parsed.data.postId}`);
  }

  return result;
}

export async function deleteComment(commentId: string, postId: string) {
  const { data: currentUser, error: userError } = await getCurrentUser();

  if (!currentUser) {
    return { data: null, error: userError ?? "Chưa đăng nhập" };
  }

  const result = await deleteCommentHelper(commentId, currentUser.id);

  if (result.data) {
    revalidatePath(`/community/${postId}`);
  }

  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PostStatus, PostWithAuthorEmail } from "@/lib/supabase/types";
import { normalizeContentForSave } from "@/lib/utils/editorjs";
import { isNotDeleted, restore, softDelete } from "@/lib/utils/softDelete";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

function parsePostForm(formData: FormData) {
  const rawContent = String(formData.get("content") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    content: normalizeContentForSave(rawContent),
    cover_image_url: (formData.get("cover_image_url") as string) || null,
    status: (formData.get("status") as PostStatus) || "draft",
  };
}

export async function getAllPosts(): Promise<PostWithAuthorEmail[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`*, author:users!posts_author_id_fkey(id, full_name, avatar_url)`)
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !posts) return [];

  const adminClient = createAdminClient();
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const emailMap = new Map<string, string | null>();

  await Promise.all(
    authorIds.map(async (authorId) => {
      const { data: authData } = await adminClient.auth.admin.getUserById(authorId);
      emailMap.set(authorId, authData.user?.email ?? null);
    })
  );

  return posts.map((post) => {
    const row = post as PostWithAuthorEmail;
    return {
      ...row,
      author: {
        ...row.author,
        email: emailMap.get(post.author_id) ?? null,
      },
    };
  });
}

/** @deprecated use getAllPosts */
export async function getAllPostsAdmin() {
  return getAllPosts();
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  let authUser;
  try {
    authUser = await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const payload = parsePostForm(formData);
  if (!payload.title || !payload.content) {
    return { error: "Tiêu đề và nội dung là bắt buộc" };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("posts").insert({
    ...payload,
    author_id: authUser.id,
    published_at: payload.status === "published" ? now : null,
    updated_at: now,
  });

  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath("/admin/community");
  revalidatePath("/admin/dashboard");
  return { data: undefined };
}

export async function updatePost(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: existing } = await isNotDeleted(
    supabase.from("posts").select("status, published_at")
  )
    .eq("id", id)
    .single();

  const payload = parsePostForm(formData);
  const now = new Date().toISOString();

  let publishedAt = existing?.published_at ?? null;
  if (payload.status === "published" && existing?.status === "draft") {
    publishedAt = now;
  } else if (payload.status === "draft") {
    publishedAt = null;
  }

  const { error } = await supabase
    .from("posts")
    .update({
      ...payload,
      updated_at: now,
      published_at: publishedAt,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath(`/community/${id}`);
  revalidatePath("/admin/community");
  return { data: undefined };
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "posts", id);
  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath("/admin/community");
  revalidatePath("/admin/dashboard");
  return { data: undefined };
}

export async function restorePost(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await restore(supabase, "posts", id);
  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath("/admin/community");
  revalidatePath("/admin/dashboard");
  return { data: undefined };
}

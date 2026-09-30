"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { PostStatus, PostWithAuthorEmail } from "@/lib/supabase/types";
import { normalizeContentForSave } from "@/lib/utils/editorjs";
import { isNotDeleted, restore, softDelete } from "@/lib/utils/softDelete";
import {
  emptyPaginated,
  escapeIlike,
  getPaginationRange,
  isUnsatisfiableRangeError,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/utils/pagination";

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

export type AdminPostListFilters = {
  page?: number;
  search?: string;
  status?: "all" | PostStatus;
};

export async function getAllPosts(
  filters: AdminPostListFilters = {}
): Promise<PaginatedResult<PostWithAuthorEmail>> {
  const page = filters.page ?? 1;

  try {
    await requireAdmin();
  } catch {
    return emptyPaginated(page, "Không có quyền thực hiện thao tác này");
  }

  const supabase = await createClient();
  const { from, to, currentPage } = getPaginationRange(page);
  const trimmed = filters.search?.trim();
  const escaped = trimmed ? escapeIlike(trimmed) : undefined;

  let query = supabase
    .from("posts")
    .select(
      "id, title, content, author_id, published_at, updated_at, status, cover_image_url, deleted_at, author:users!posts_author_id_fkey(id, full_name, avatar_url)",
      { count: "exact" }
    )
    .order("published_at", { ascending: false, nullsFirst: false });

  if (escaped) {
    query = query.ilike("title", `%${escaped}%`);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data: posts, error, count } = await query.range(from, to);

  if (error || !posts) {
    if (isUnsatisfiableRangeError(error)) {
      let countQuery = supabase
        .from("posts")
        .select("id", { count: "exact", head: true });
      if (escaped) {
        countQuery = countQuery.ilike("title", `%${escaped}%`);
      }
      if (filters.status && filters.status !== "all") {
        countQuery = countQuery.eq("status", filters.status);
      }
      const { count: total } = await countQuery;
      return toPaginatedResult([], total, currentPage, null);
    }
    return emptyPaginated(currentPage, error?.message ?? null);
  }

  const adminClient = createAdminClient();
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const emailMap = new Map<string, string | null>();

  await Promise.all(
    authorIds.map(async (authorId) => {
      const { data: authData } = await adminClient.auth.admin.getUserById(authorId);
      emailMap.set(authorId, authData.user?.email ?? null);
    })
  );

  const mapped = posts.map((post) => {
    const row = post as PostWithAuthorEmail;
    return {
      ...row,
      author: {
        ...row.author,
        email: emailMap.get(post.author_id) ?? null,
      },
    };
  });

  return toPaginatedResult(mapped, count, currentPage, null);
}

/** @deprecated use getAllPosts */
export async function getAllPostsAdmin(filters: AdminPostListFilters = {}) {
  return getAllPosts(filters);
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

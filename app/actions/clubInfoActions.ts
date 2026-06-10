"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { ClubHistory, ClubInfo } from "@/lib/supabase/types";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { restore, softDelete } from "@/lib/utils/softDelete";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

function parseHistoryForm(formData: FormData) {
  const rawContent = String(formData.get("content") ?? "").trim();
  return {
    title: String(formData.get("title") ?? "").trim(),
    content: cleanHtmlContent(rawContent),
    event_date: String(formData.get("event_date") ?? ""),
    image_url: (formData.get("image_url") as string) || null,
    order_index: Number(formData.get("order_index") ?? 0),
  };
}

export async function getClubInfo(): Promise<ClubInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_info")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function updateClubInfo(
  content: string,
  coverImageUrl?: string
): Promise<ActionResult<ClubInfo>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_info")
    .upsert({
      id: "about",
      title: "Giới thiệu CLB",
      content: cleanHtmlContent(content),
      cover_image_url: coverImageUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/about");
  revalidatePath("/admin/club-info");
  return { data };
}

export async function getHistory(): Promise<ClubHistory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_history")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getHistoryTimeline() {
  return getHistory();
}

export async function addHistoryEntry(
  formData: FormData
): Promise<ActionResult<ClubHistory>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const payload = parseHistoryForm(formData);
  if (!payload.title || !payload.content || !payload.event_date) {
    return { error: "Vui lòng điền đầy đủ thông tin bắt buộc" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_history")
    .insert(payload)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/history");
  revalidatePath("/admin/club-info");
  return { data };
}

export async function updateHistoryEntry(
  id: string,
  formData: FormData
): Promise<ActionResult<ClubHistory>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const payload = parseHistoryForm(formData);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_history")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/history");
  revalidatePath("/admin/club-info");
  return { data };
}

export async function deleteHistoryEntry(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "club_history", id);
  if (error) return { error: error.message };

  revalidatePath("/history");
  revalidatePath("/admin/club-info");
  return { data: undefined };
}

export async function restoreHistoryEntry(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await restore(supabase, "club_history", id);
  if (error) return { error: error.message };

  revalidatePath("/history");
  revalidatePath("/admin/club-info");
  return { data: undefined };
}

export async function reorderHistoryEntries(
  orderedIds: string[]
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const updates = orderedIds.map((entryId, index) =>
    supabase.from("club_history").update({ order_index: index }).eq("id", entryId)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/history");
  revalidatePath("/admin/club-info");
  return { data: undefined };
}

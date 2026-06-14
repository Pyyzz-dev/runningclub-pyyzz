"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { ClubHistory, ClubInfo } from "@/lib/supabase/types";
import { toIsoDateTime } from "@/lib/format";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { restore, softDelete } from "@/lib/utils/softDelete";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

const DEFAULT_CLUB_CONTENT =
  "<p>Chào mừng đến với CLB Chạy bộ CMC Global</p>";

async function getOrCreateClubInfoId(): Promise<string | null> {
  const supabase = await createClient();

  const { data: clubInfo, error: fetchError } = await supabase
    .from("club_info")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching club_info id:", fetchError);
    return null;
  }

  if (clubInfo?.id) {
    return clubInfo.id;
  }

  const { data: newClubInfo, error: insertError } = await supabase
    .from("club_info")
    .insert({
      content: DEFAULT_CLUB_CONTENT,
      cover_image_url: null,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating club_info:", insertError);
    return null;
  }

  return newClubInfo.id;
}

function parseHistoryForm(formData: FormData) {
  const rawContent = String(formData.get("content") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "");

  return {
    title: String(formData.get("title") ?? "").trim(),
    content: cleanHtmlContent(rawContent),
    event_date: toIsoDateTime(eventDate),
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

  if (error) {
    console.error("Error fetching club info:", error);
    return null;
  }

  return data;
}

export async function updateClubInfo(
  formData: FormData
): Promise<ActionResult<ClubInfo>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const clubInfoId = await getOrCreateClubInfoId();
  if (!clubInfoId) {
    return { error: "Không thể tạo hoặc tìm thấy bản ghi giới thiệu" };
  }

  const rawContent = String(formData.get("content") ?? "");
  const coverImageUrl = String(formData.get("coverImageUrl") ?? "").trim() || null;

  if (!rawContent.trim() || rawContent === "<p></p>") {
    return { error: "Nội dung không được để trống" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("club_info")
    .update({
      content: cleanHtmlContent(rawContent),
      cover_image_url: coverImageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clubInfoId)
    .select()
    .single();

  if (error) {
    console.error("Update club_info error:", error);
    return { error: error.message };
  }

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

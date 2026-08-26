"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; message: string }
  | { error: string };

function revalidateEventPages(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

function mapInsertError(message: string): string {
  if (message.includes("event_participants") && message.includes("does not exist")) {
    return "Bảng tham gia sự kiện chưa được cấu hình. Vui lòng chạy migration Supabase 018.";
  }
  if (message.includes("duplicate key") || message.includes("unique constraint")) {
    return "Bạn đã tham gia sự kiện này rồi";
  }
  if (message.includes("foreign key")) {
    return "Tài khoản chưa được đồng bộ với hệ thống thành viên";
  }
  return "Không thể tham gia sự kiện";
}

async function syncEventParticipantCount(eventId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (countError) {
    console.error("[joinEvent] sync count query failed:", countError.message);
    return { error: "Không thể cập nhật số lượng tham gia" };
  }

  const { error: updateError } = await admin
    .from("events")
    .update({ participant_count: count ?? 0 })
    .eq("id", eventId);

  if (updateError) {
    console.error("[joinEvent] sync count update failed:", updateError.message);
    return { error: "Không thể cập nhật số lượng tham gia" };
  }

  return {};
}

export async function getParticipationStatus(eventId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getParticipationStatus] query failed:", error.message);
    return { joined: false };
  }

  return { joined: !!data };
}

export async function getUserEventParticipations(
  userId: string
): Promise<Record<string, boolean>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_participants")
    .select("event_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[getUserEventParticipations] query failed:", error.message);
    return {};
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.event_id, true] as const)
  );
}

export async function joinEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vui lòng đăng nhập để tham gia sự kiện" };
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "Bạn đã tham gia sự kiện này rồi" };
  }

  const { error: insertError } = await supabase.from("event_participants").insert({
    event_id: eventId,
    user_id: user.id,
  });

  if (insertError) {
    console.error("[joinEvent] insert failed:", insertError.message);
    return { error: mapInsertError(insertError.message) };
  }

  const countResult = await syncEventParticipantCount(eventId);
  if (countResult.error) {
    await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", user.id);
    return { error: countResult.error };
  }

  revalidateEventPages(eventId);
  return { success: true, message: "Đã tham gia sự kiện" };
}

export async function leaveEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vui lòng đăng nhập" };
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { error: "Bạn chưa tham gia sự kiện này" };
  }

  const { error: deleteError } = await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[leaveEvent] delete failed:", deleteError.message);
    return { error: "Không thể rời sự kiện" };
  }

  const countResult = await syncEventParticipantCount(eventId);
  if (countResult.error) {
    await supabase.from("event_participants").insert({
      event_id: eventId,
      user_id: user.id,
    });
    return { error: countResult.error };
  }

  revalidateEventPages(eventId);
  return { success: true, message: "Đã rời sự kiện" };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

async function incrementParticipantCount(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_event_count", {
    event_id: eventId,
  });

  if (error) {
    return { error: "Không thể cập nhật số lượng tham gia" };
  }

  return {};
}

async function decrementParticipantCount(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decrement_event_count", {
    event_id: eventId,
  });

  if (error) {
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

  if (error) return { joined: false };
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

  if (error) return {};

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
    return { error: "Không thể tham gia sự kiện" };
  }

  const countResult = await incrementParticipantCount(eventId);
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
    return { error: "Không thể rời sự kiện" };
  }

  const countResult = await decrementParticipantCount(eventId);
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

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; message: string }
  | { error: string };

function revalidateTrainingPages(trainingId?: string) {
  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/");
  if (trainingId) {
    revalidatePath(`/training/${trainingId}`);
  }
}

async function incrementParticipantCount(trainingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_training_count", {
    training_id: trainingId,
  });

  if (error) {
    return { error: "Không thể cập nhật số lượng đăng ký" };
  }

  return {};
}

async function decrementParticipantCount(trainingId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("decrement_training_count", {
    training_id: trainingId,
  });

  if (error) {
    return { error: "Không thể cập nhật số lượng đăng ký" };
  }

  return {};
}

export async function getRegistrationStatus(trainingId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_participants")
    .select("id")
    .eq("training_id", trainingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { registered: false };
  return { registered: !!data };
}

export async function getUserTrainingRegistrations(
  userId: string
): Promise<Record<string, boolean>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("training_participants")
    .select("training_id")
    .eq("user_id", userId);

  if (error) return {};

  return Object.fromEntries(
    (data ?? []).map((row) => [row.training_id, true] as const)
  );
}

export async function registerForTraining(trainingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vui lòng đăng nhập để đăng ký" };
  }

  const { data: existing } = await supabase
    .from("training_participants")
    .select("id")
    .eq("training_id", trainingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "Bạn đã đăng ký buổi tập này rồi" };
  }

  const { error: insertError } = await supabase.from("training_participants").insert({
    training_id: trainingId,
    user_id: user.id,
  });

  if (insertError) {
    return { error: "Không thể đăng ký, vui lòng thử lại" };
  }

  const countResult = await incrementParticipantCount(trainingId);
  if (countResult.error) {
    await supabase
      .from("training_participants")
      .delete()
      .eq("training_id", trainingId)
      .eq("user_id", user.id);
    return { error: countResult.error };
  }

  revalidateTrainingPages(trainingId);
  return { success: true, message: "Đã đăng ký tham gia buổi tập" };
}

export async function unregisterFromTraining(trainingId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vui lòng đăng nhập" };
  }

  const { data: existing } = await supabase
    .from("training_participants")
    .select("id")
    .eq("training_id", trainingId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { error: "Bạn chưa đăng ký buổi tập này" };
  }

  const { error: deleteError } = await supabase
    .from("training_participants")
    .delete()
    .eq("training_id", trainingId)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: "Không thể hủy đăng ký" };
  }

  const countResult = await decrementParticipantCount(trainingId);
  if (countResult.error) {
    await supabase.from("training_participants").insert({
      training_id: trainingId,
      user_id: user.id,
    });
    return { error: countResult.error };
  }

  revalidateTrainingPages(trainingId);
  return { success: true, message: "Đã hủy đăng ký" };
}

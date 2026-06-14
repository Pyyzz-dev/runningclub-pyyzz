"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; message: string }
  | { error: string };

function revalidateTrainingPages() {
  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/");
}

async function adjustParticipantCount(
  trainingId: string,
  delta: 1 | -1
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: training, error: fetchError } = await supabase
    .from("training_schedule")
    .select("participant_count")
    .eq("id", trainingId)
    .single();

  if (fetchError || !training) {
    return { error: "Không tìm thấy buổi tập" };
  }

  const currentCount = training.participant_count ?? 0;
  const nextCount = delta === 1 ? currentCount + 1 : Math.max(0, currentCount - 1);

  const { error: updateError } = await supabase
    .from("training_schedule")
    .update({ participant_count: nextCount })
    .eq("id", trainingId);

  if (updateError) {
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

  const countResult = await adjustParticipantCount(trainingId, 1);
  if (countResult.error) {
    await supabase
      .from("training_participants")
      .delete()
      .eq("training_id", trainingId)
      .eq("user_id", user.id);
    return { error: countResult.error };
  }

  revalidateTrainingPages();
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

  const countResult = await adjustParticipantCount(trainingId, -1);
  if (countResult.error) {
    await supabase.from("training_participants").insert({
      training_id: trainingId,
      user_id: user.id,
    });
    return { error: countResult.error };
  }

  revalidateTrainingPages();
  return { success: true, message: "Đã hủy đăng ký" };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { restore, softDelete } from "@/lib/utils/softDelete";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

function parseTrainingForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: (formData.get("description") as string) || null,
    location: String(formData.get("location") ?? "").trim(),
    start_time: String(formData.get("start_time") ?? ""),
    end_time: String(formData.get("end_time") ?? ""),
  };
}

export async function getTrainings(): Promise<TrainingSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_schedule")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function createTraining(
  formData: FormData
): Promise<ActionResult<TrainingSchedule>> {
  let authUser;
  try {
    authUser = await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const payload = parseTrainingForm(formData);
  if (!payload.title || !payload.location || !payload.start_time || !payload.end_time) {
    return { error: "Vui lòng điền đầy đủ thông tin bắt buộc" };
  }

  if (new Date(payload.end_time) <= new Date(payload.start_time)) {
    return { error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_schedule")
    .insert({ ...payload, created_by: authUser.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/admin/dashboard");
  return { data };
}

export async function updateTraining(
  id: string,
  formData: FormData
): Promise<ActionResult<TrainingSchedule>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const payload = parseTrainingForm(formData);
  if (new Date(payload.end_time) <= new Date(payload.start_time)) {
    return { error: "Thời gian kết thúc phải sau thời gian bắt đầu" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_schedule")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/training");
  revalidatePath("/admin/training");
  return { data };
}

export async function deleteTraining(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "training_schedule", id);
  if (error) return { error: error.message };

  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/admin/dashboard");
  return { data: undefined };
}

export async function restoreTraining(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await restore(supabase, "training_schedule", id);
  if (error) return { error: error.message };

  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/admin/dashboard");
  return { data: undefined };
}

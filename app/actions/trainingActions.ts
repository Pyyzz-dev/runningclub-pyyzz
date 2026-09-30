"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { toIsoDateTime } from "@/lib/format";
import { createVietnamDate } from "@/lib/utils/timezone";
import { restore, softDelete } from "@/lib/utils/softDelete";
import {
  emptyPaginated,
  escapeIlike,
  getPaginationRange,
  isUnsatisfiableRangeError,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/utils/pagination";
import type { TrainingStatus } from "@/lib/utils/trainingStatus";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

function parseTrainingForm(formData: FormData) {
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  return {
    title: String(formData.get("title") ?? "").trim(),
    description: (formData.get("description") as string) || null,
    location: String(formData.get("location") ?? "").trim(),
    start_time: toIsoDateTime(startTime),
    end_time: toIsoDateTime(endTime),
  };
}

export type AdminTrainingListFilters = {
  page?: number;
  search?: string;
  month?: string;
  status?: "all" | TrainingStatus;
};

function monthStartEnd(monthValue: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const start = createVietnamDate(year, month, 1, 0, 0);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = createVietnamDate(nextYear, nextMonth, 1, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getTrainings(
  filters: AdminTrainingListFilters = {}
): Promise<PaginatedResult<TrainingSchedule>> {
  const page = filters.page ?? 1;
  const supabase = await createClient();
  const { from, to, currentPage } = getPaginationRange(page);
  const trimmed = filters.search?.trim();
  const escaped = trimmed ? escapeIlike(trimmed) : undefined;
  const now = new Date().toISOString();

  let query = supabase
    .from("training_schedule")
    .select(
      "id, title, description, location, start_time, end_time, created_by, deleted_at, participant_count",
      { count: "exact" }
    )
    .order("start_time", { ascending: true });

  if (escaped) {
    query = query.or(`title.ilike.%${escaped}%,location.ilike.%${escaped}%`);
  }

  const monthRange = filters.month ? monthStartEnd(filters.month) : null;
  if (monthRange) {
    query = query.gte("start_time", monthRange.start).lt("start_time", monthRange.end);
  }

  if (filters.status === "upcoming") {
    query = query.gt("start_time", now);
  } else if (filters.status === "ongoing") {
    query = query.lte("start_time", now).gte("end_time", now);
  } else if (filters.status === "completed") {
    query = query.lt("end_time", now);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) {
    if (isUnsatisfiableRangeError(error)) {
      return toPaginatedResult([], 0, currentPage, null);
    }
    return emptyPaginated(currentPage, error.message);
  }

  return toPaginatedResult(data, count, currentPage, null);
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

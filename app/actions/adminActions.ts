"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { LeaderboardPeriodType } from "@/lib/supabase/types";
import { toIsoDateTime } from "@/lib/format";
import {
  createEvent as createEventHelper,
  createMemberAccount as createMemberAccountHelper,
  createTrainingSchedule as createTrainingScheduleHelper,
  resetUserPassword as resetUserPasswordHelper,
  updateLeaderboard as updateLeaderboardHelper,
  updateUserRole as updateUserRoleHelper,
} from "@/lib/utils/db-helpers";

const memberSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(1, "Họ tên không được để trống"),
});

const trainingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  start_time: z.string().min(1),
  end_time: z.string().optional().nullable(),
});

const eventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  event_date: z.string().min(1),
  registration_deadline: z.string().optional().nullable(),
  event_link: z.string().url().optional().nullable(),
});

const leaderboardSchema = z.object({
  user_id: z.string().uuid(),
  total_distance_km: z.coerce.number().min(0),
  total_time_minutes: z.coerce.number().min(0),
  average_pace: z.coerce.number().optional().nullable(),
  period_type: z.enum(["weekly", "monthly", "yearly", "all_time"]),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
});

export async function createMember(formData: FormData) {
  const parsed = memberSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const result = await createMemberAccountHelper(
    parsed.data.email,
    parsed.data.password,
    parsed.data.fullName
  );

  if (result.data) {
    revalidatePath("/admin/members");
  }

  return result;
}

export async function updateMemberRole(userId: string, newRole: "admin" | "member") {
  const result = await updateUserRoleHelper(userId, newRole);

  if (result.data) {
    revalidatePath("/admin/members");
  }

  return result;
}

export async function resetMemberPassword(userId: string, newPassword: string) {
  const parsed = z.string().min(6).safeParse(newPassword);

  if (!parsed.success) {
    return { data: null, error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }

  return resetUserPasswordHelper(userId, parsed.data);
}

export async function updateLeaderboard(formData: FormData) {
  const parsed = leaderboardSchema.safeParse({
    user_id: formData.get("user_id"),
    total_distance_km: formData.get("total_distance_km"),
    total_time_minutes: formData.get("total_time_minutes"),
    average_pace: formData.get("average_pace") || null,
    period_type: formData.get("period_type"),
    period_start: formData.get("period_start"),
    period_end: formData.get("period_end"),
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const result = await updateLeaderboardHelper({
    ...parsed.data,
    period_type: parsed.data.period_type as LeaderboardPeriodType,
  });

  if (result.data) {
    revalidatePath("/leaderboard");
    revalidatePath("/admin/leaderboard");
  }

  return result;
}

export async function addTraining(formData: FormData) {
  const parsed = trainingSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    location: formData.get("location") || null,
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time") || null,
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const result = await createTrainingScheduleHelper({
    ...parsed.data,
    start_time: toIsoDateTime(parsed.data.start_time),
    end_time: parsed.data.end_time ? toIsoDateTime(parsed.data.end_time) : null,
  });

  if (result.data) {
    revalidatePath("/training");
    revalidatePath("/admin/training");
  }

  return result;
}

export async function addEvent(formData: FormData) {
  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    location: formData.get("location") || null,
    event_date: formData.get("event_date"),
    registration_deadline: formData.get("registration_deadline") || null,
    event_link: formData.get("event_link") || null,
  });

  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const result = await createEventHelper({
    ...parsed.data,
    event_date: toIsoDateTime(parsed.data.event_date),
    registration_deadline: parsed.data.registration_deadline
      ? toIsoDateTime(parsed.data.registration_deadline)
      : null,
  });

  if (result.data) {
    revalidatePath("/events");
    revalidatePath("/admin/events");
  }

  return result;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { isNotDeleted } from "@/lib/utils/softDelete";

const DEFAULT_TRAINING = {
  title: "Offline hàng tuần - Chạy cùng CLB",
  description:
    "Buổi chạy offline hàng tuần tại công viên Hồ Điều Hòa. Các thành viên tập trung tại cổng chính lúc 17:45 để khởi động.",
  location: "Công viên Hồ Điều Hòa",
  hour: 18,
  minute: 0,
  durationHours: 1,
  weekday: 3, // Thứ 4 (0 = Chủ nhật)
} as const;

type GenerateResult =
  | { success: true; message: string; trainings: TrainingSchedule[] }
  | { error: string };

/** Ngày Thứ 4 gần nhất (tuần hiện tại hoặc tuần sau nếu đã qua giờ tập). */
function getNextWednesday(fromDate: Date = new Date()): Date {
  const session = new Date(fromDate);
  session.setHours(DEFAULT_TRAINING.hour, DEFAULT_TRAINING.minute, 0, 0);

  const currentWeekday = fromDate.getDay();
  let daysUntilWednesday =
    (DEFAULT_TRAINING.weekday - currentWeekday + 7) % 7;

  if (daysUntilWednesday === 0 && fromDate >= session) {
    daysUntilWednesday = 7;
  }

  session.setDate(fromDate.getDate() + daysUntilWednesday);
  session.setHours(DEFAULT_TRAINING.hour, DEFAULT_TRAINING.minute, 0, 0);
  return session;
}

function revalidateTrainingPaths() {
  revalidatePath("/training");
  revalidatePath("/admin/training");
  revalidatePath("/admin/dashboard");
  revalidatePath("/");
}

export async function generateWeeklyTrainings(weeks = 4): Promise<GenerateResult> {
  let authUser;
  try {
    authUser = await requireAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không có quyền admin";
    return { error: message };
  }

  const safeWeeks = Math.min(Math.max(1, Math.floor(weeks)), 52);
  const supabase = await createClient();
  const trainingsCreated: TrainingSchedule[] = [];

  let currentWednesday = getNextWednesday(new Date());

  for (let i = 0; i < safeWeeks; i++) {
    const startTime = new Date(currentWednesday);
    const endTime = new Date(currentWednesday);
    endTime.setHours(
      DEFAULT_TRAINING.hour + DEFAULT_TRAINING.durationHours,
      DEFAULT_TRAINING.minute,
      0,
      0
    );

    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existing } = await isNotDeleted(
      supabase.from("training_schedule").select("id")
    )
      .eq("title", DEFAULT_TRAINING.title)
      .gte("start_time", startTime.toISOString())
      .lte("start_time", dayEnd.toISOString())
      .maybeSingle();

    if (!existing) {
      const { data, error } = await supabase
        .from("training_schedule")
        .insert({
          title: DEFAULT_TRAINING.title,
          description: DEFAULT_TRAINING.description,
          location: DEFAULT_TRAINING.location,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          created_by: authUser.id,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      if (data) {
        trainingsCreated.push(data);
      }
    }

    currentWednesday = new Date(currentWednesday);
    currentWednesday.setDate(currentWednesday.getDate() + 7);
  }

  revalidateTrainingPaths();

  return {
    success: true,
    message: `Đã tạo ${trainingsCreated.length}/${safeWeeks} buổi tập`,
    trainings: trainingsCreated,
  };
}

export async function generateYearlyTrainings(): Promise<GenerateResult> {
  return generateWeeklyTrainings(52);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { isNotDeleted } from "@/lib/utils/softDelete";
import {
  addCalendarDays,
  createVietnamDate,
  getNextWednesday,
  vietnamDayBounds,
} from "@/lib/utils/timezone";

const DEFAULT_TRAINING = {
  title: "Offline hàng tuần - Chạy cùng CLB",
  description:
    "Buổi chạy offline hàng tuần tại công viên Hồ Điều Hòa. Các thành viên tập trung tại cổng chính lúc 17:45 để khởi động.",
  location: "Công viên Hồ Điều Hòa",
  hour: 18,
  minute: 0,
  durationHours: 1,
} as const;

type GenerateResult =
  | { success: true; message: string; trainings: TrainingSchedule[] }
  | { error: string };

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

  let { year, month, day } = getNextWednesday(
    new Date(),
    DEFAULT_TRAINING.hour,
    DEFAULT_TRAINING.minute
  );

  for (let i = 0; i < safeWeeks; i++) {
    const startTime = createVietnamDate(
      year,
      month,
      day,
      DEFAULT_TRAINING.hour,
      DEFAULT_TRAINING.minute
    );
    const endTime = createVietnamDate(
      year,
      month,
      day,
      DEFAULT_TRAINING.hour + DEFAULT_TRAINING.durationHours,
      DEFAULT_TRAINING.minute
    );
    const { start: dayStart, end: dayEnd } = vietnamDayBounds(year, month, day);

    const { data: existing } = await isNotDeleted(
      supabase.from("training_schedule").select("id")
    )
      .eq("title", DEFAULT_TRAINING.title)
      .gte("start_time", dayStart.toISOString())
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

    ({ year, month, day } = addCalendarDays(year, month, day, 7));
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

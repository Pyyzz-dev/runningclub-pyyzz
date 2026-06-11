"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/supabase/types";
import { toIsoDateTime } from "@/lib/format";
import { restore, softDelete } from "@/lib/utils/softDelete";

type ActionResult<T = undefined> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "URL không hợp lệ",
  });

const eventSchema = z.object({
  name: z.string().trim().min(1, "Tên sự kiện không được để trống"),
  location: z.string().trim().min(1, "Địa điểm không được để trống"),
  event_date: z.string().min(1, "Ngày diễn ra không hợp lệ"),
  registration_deadline: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  description: z
    .string()
    .optional()
    .nullable()
    .transform((value) => (value?.trim() ? value.trim() : null)),
  participant_count: z.coerce.number().int().min(0).default(0),
  event_link: optionalUrl,
  image_url: optionalUrl,
});

function parseEventForm(formData: FormData) {
  const parsed = eventSchema.parse({
    name: formData.get("name"),
    location: formData.get("location"),
    event_date: formData.get("event_date"),
    registration_deadline: formData.get("registration_deadline") || null,
    description: formData.get("description") || null,
    participant_count: formData.get("participant_count") ?? 0,
    event_link: formData.get("event_link") || null,
    image_url: formData.get("image_url") || null,
  });

  return {
    ...parsed,
    event_date: toIsoDateTime(parsed.event_date),
    registration_deadline: parsed.registration_deadline
      ? toIsoDateTime(parsed.registration_deadline)
      : null,
  };
}

function revalidateEventPaths(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/admin/events");
  revalidatePath("/");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
  }
}

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function createEvent(
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  let payload;
  try {
    payload = parseEventForm(formData);
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : "Dữ liệu không hợp lệ";
    return { error: message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("events").insert(payload).select().single();

  if (error) return { error: error.message };

  revalidateEventPaths();
  return { data };
}

export async function updateEvent(
  id: string,
  formData: FormData
): Promise<ActionResult<Event>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  let payload;
  try {
    payload = parseEventForm(formData);
  } catch (e) {
    const message = e instanceof z.ZodError ? e.issues[0]?.message : "Dữ liệu không hợp lệ";
    return { error: message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidateEventPaths();
  return { data };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await softDelete(supabase, "events", id);

  if (error) return { error: error.message };

  revalidateEventPaths();
  return { data: undefined };
}

export async function restoreEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await restore(supabase, "events", id);

  if (error) return { error: error.message };

  revalidateEventPaths();
  return { data: undefined };
}

export async function updateParticipantCount(
  id: string,
  count: number
): Promise<ActionResult<Event>> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized" };
  }

  const safeCount = Math.max(0, Math.floor(count));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({ participant_count: safeCount })
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidateEventPaths(id);
  return { data };
}

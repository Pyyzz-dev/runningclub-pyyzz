import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type SoftDeleteTable =
  | "posts"
  | "comments"
  | "club_history"
  | "training_schedule"
  | "events";

export function softDelete(
  supabase: SupabaseClient<Database>,
  table: SoftDeleteTable,
  id: string
) {
  return supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
}

export function restore(
  supabase: SupabaseClient<Database>,
  table: SoftDeleteTable,
  id: string
) {
  return supabase.from(table).update({ deleted_at: null }).eq("id", id);
}

export function isNotDeleted<T extends { is: (column: string, value: null) => T }>(
  query: T
): T {
  return query.is("deleted_at", null);
}

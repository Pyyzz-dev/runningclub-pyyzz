import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";
import { cleanHtmlContent } from "../lib/utils/cleanHtml";

function loadEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function fixAllPosts() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey);

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, title, content");

  if (postsError) {
    console.error("❌ posts:", postsError.message);
    process.exit(1);
  }

  console.log("Đang sửa HTML bài viết...\n");

  for (const post of posts ?? []) {
    if (!post.content) continue;
    const cleanContent = cleanHtmlContent(post.content);
    if (cleanContent === post.content) continue;

    const { error } = await supabase
      .from("posts")
      .update({ content: cleanContent })
      .eq("id", post.id);

    if (error) {
      console.error(`❌ ${post.id}:`, error.message);
      continue;
    }
    console.log(`✅ Fixed: ${post.title}`);
  }

  const { data: clubInfoRows } = await supabase.from("club_info").select("id, content");
  for (const row of clubInfoRows ?? []) {
    if (!row.content) continue;
    const cleanContent = cleanHtmlContent(row.content);
    if (cleanContent === row.content) continue;
    await supabase.from("club_info").update({ content: cleanContent }).eq("id", row.id);
    console.log(`✅ Fixed club_info: ${row.id}`);
  }

  const { data: historyRows } = await supabase.from("club_history").select("id, title, content");
  for (const row of historyRows ?? []) {
    if (!row.content) continue;
    const cleanContent = cleanHtmlContent(row.content);
    if (cleanContent === row.content) continue;
    await supabase.from("club_history").update({ content: cleanContent }).eq("id", row.id);
    console.log(`✅ Fixed history: ${row.title}`);
  }

  console.log("\nHoàn tất.");
}

fixAllPosts().catch((err) => {
  console.error(err);
  process.exit(1);
});

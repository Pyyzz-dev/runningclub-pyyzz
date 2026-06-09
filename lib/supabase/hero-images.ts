import {
  HERO_SECTION_FOLDER,
  STORAGE_BUCKET_NAME,
} from "@/lib/supabase/storage-config";
import { createClient } from "@/lib/supabase/server";

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;

export async function getHeroSlideshowImages(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_NAME)
    .list(HERO_SECTION_FOLDER, {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });

  if (error || !data?.length) {
    return [];
  }

  return data
    .filter(
      (file) =>
        Boolean(file.name) &&
        IMAGE_EXT.test(file.name) &&
        !file.name.startsWith(".")
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    .map((file) => {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(`${HERO_SECTION_FOLDER}/${file.name}`);
      return urlData.publicUrl;
    });
}

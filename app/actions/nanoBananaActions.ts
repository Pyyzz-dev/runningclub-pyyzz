"use server";

import {
  GoogleGenerativeAI,
  type GenerationConfig,
  type Part,
} from "@google/generative-ai";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { createAdminClient } from "@/lib/supabase/server";
import {
  STORAGE_BUCKET_NAME,
  buildStoragePath,
} from "@/lib/supabase/storage-config";

export type CoverAspectRatio = "16:9" | "4:3" | "1:1";

type CoverAttempt = { success: true; url: string } | { success: false; error: string };

export type NanoBananaCoverResult =
  | { success: true; url: string; usedFallback: boolean }
  | { success: false; error: string };

const COVER_TOPICS = [
  {
    terms: ["drink", "water", "hydrat", "bottle", "uong", "nuoc", "electrolyte"],
    photos: [
      "photo-1523362628745-0c100150b504",
      "photo-1548839140-29a749e1cf4d",
      "photo-1602143407151-7111542de6e8",
    ],
  },
  {
    terms: ["food", "nutrition", "meal", "diet", "protein", "dinh", "duong", "an"],
    photos: [
      "photo-1490645935967-10de6ba17061",
      "photo-1512621776951-a57141f2eefd",
      "photo-1546069901-ba9599a7e63c",
    ],
  },
  {
    terms: ["stretch", "warmup", "mobility", "yoga", "gian", "khoi", "dong"],
    photos: ["photo-1544367567-0f2fcb009e0b", "photo-1483721310020-03333e577078"],
  },
  {
    terms: ["form", "posture", "technique", "stride", "cadence", "ky", "thuat", "tu", "the"],
    photos: [
      "photo-1571008887538-b36bb32f4571",
      "photo-1476480862126-209bfaa8edc8",
      "photo-1486218119243-13883505764c",
    ],
  },
  {
    terms: ["peaceful", "solo", "sunrise", "calm", "stress", "binh", "yen"],
    photos: [
      "photo-1707326508037-d1fbd699f129",
      "photo-1486218119243-13883505764c",
      "photo-1513593771513-7b58b6c4af38",
    ],
  },
  {
    terms: ["marathon", "race", "finish", "giai", "dua"],
    photos: [
      "photo-1452626038306-9aae5e071dd3",
      "photo-1552674605-db6ffd4facb5",
      "photo-1502904550040-7534597429ae",
    ],
  },
] as const;

const DEFAULT_COVERS = [
  "photo-1476480862126-209bfaa8edc8",
  "photo-1552674605-db6ffd4facb5",
  "photo-1513593771513-7b58b6c4af38",
  "photo-1571008887538-b36bb32f4571",
  "photo-1486218119243-13883505764c",
] as const;

const IMAGE_MODEL = "gemini-3.1-flash-image";
const TEXT_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite"] as const;
const MAX_COVER_BYTES = 10 * 1024 * 1024;

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : "";
  if (/quota|rate.?limit|exceeded your current/i.test(message)) {
    return "Hết hạn mức tạo ảnh của Gemini. Model gemini-3.1-flash-image đang có quota 0 trên key này.";
  }
  return message || "Không tạo được ảnh bìa";
}

function textModels(): string[] {
  const retired = new Set<string>(["gemini-2.5-flash", "gemini-2.5-flash-lite"]);
  const fromEnv = process.env.GEMINI_MODEL?.split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !retired.has(name));

  if (fromEnv && fromEnv.length > 0) {
    return [...new Set(fromEnv)];
  }

  return [...TEXT_MODELS];
}

function imageGenerationConfig(aspectRatio: CoverAspectRatio): GenerationConfig {
  const config = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio },
  };
  return config as GenerationConfig;
}

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickUnsplashPhoto(title: string, englishTitle: string): string {
  const haystack = ` ${normalizeSearchText(`${title} ${englishTitle}`)} `;
  let bestScore = 0;
  let photos: readonly string[] = DEFAULT_COVERS;

  for (const topic of COVER_TOPICS) {
    let score = 0;
    for (const term of topic.terms) {
      const matched = term.length >= 5 ? haystack.includes(term) : haystack.includes(` ${term} `);
      if (matched) score += term.length;
    }
    if (score > bestScore) {
      bestScore = score;
      photos = topic.photos;
    }
  }

  const index = Date.now() % photos.length;
  return photos[index] ?? DEFAULT_COVERS[0];
}

/**
 * Ảnh Unsplash 16:9 khi Nano Banana không tạo được ảnh.
 * source.unsplash.com trả HTTP 503, nên dùng ảnh images.unsplash.com đã kiểm tra.
 */
async function generateCoverImageWithUnsplash(
  title: string,
  englishTitle: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const photoId = pickUnsplashPhoto(title, englishTitle);
    const imageUrl = `https://images.unsplash.com/${photoId}?w=1200&h=675&fit=crop&q=80&auto=format`;
    return { success: true, url: imageUrl };
  } catch (error) {
    console.error("Unsplash fallback error:", error);
    return { success: false, error: errorMessage(error) };
  }
}

function readInlineImage(parts: readonly Part[]): { mimeType: string; data: string } | null {
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index];
    if (!part || !("inlineData" in part) || !part.inlineData?.data) continue;
    const mimeType = part.inlineData.mimeType.startsWith("image/")
      ? part.inlineData.mimeType
      : "image/png";
    return { mimeType, data: part.inlineData.data };
  }
  return null;
}

/**
 * Dịch title tiếng Việt sang tiếng Anh.
 * gemini-2.5-flash khai tử ngày 20/10/2026, nên dùng model chữ đang cấu hình trong dự án.
 */
async function translateTitleToEnglish(title: string): Promise<string> {
  const genAI = getGenAI();
  const prompt = `Translate this Vietnamese title to English. Return ONLY the translation, nothing else:\n"${title}"`;

  for (const modelName of textModels()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const translated = result.response.text().trim().replace(/^["']|["']$/g, "");
      if (translated) return translated;
    } catch (error) {
      console.warn("Translation failed:", modelName, error);
    }
  }

  return title;
}

/**
 * Tạo ảnh bìa bằng Nano Banana 2 (Gemini 3.1 Flash Image) và lưu lên Supabase Storage.
 */
export async function generateCoverImageWithNanoBanana(
  imagePrompt: string,
  aspectRatio: CoverAspectRatio = "16:9"
): Promise<CoverAttempt> {
  try {
    await requireAdmin();

    const prompt = imagePrompt.trim();
    if (!prompt) {
      return { success: false, error: "Thiếu mô tả ảnh bìa" };
    }

    const model = getGenAI().getGenerativeModel(
      {
        model: IMAGE_MODEL,
        generationConfig: imageGenerationConfig(aspectRatio),
      },
      { timeout: 55_000 }
    );

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const imagePart = readInlineImage(result.response.candidates?.[0]?.content?.parts ?? []);
    if (!imagePart) {
      return { success: false, error: "Không nhận được ảnh từ Nano Banana" };
    }

    const imageBuffer = Buffer.from(imagePart.data, "base64");
    if (imageBuffer.length === 0) {
      return { success: false, error: "Không nhận được ảnh từ Nano Banana" };
    }
    if (imageBuffer.length > MAX_COVER_BYTES) {
      return { success: false, error: "Ảnh bìa vượt quá 10MB" };
    }

    const fileName = `nanobanana-cover-${Date.now()}.${extensionForMime(imagePart.mimeType)}`;
    const filePath = buildStoragePath("posts", fileName);
    const supabaseAdmin = createAdminClient();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePath, new Uint8Array(imageBuffer), {
        contentType: imagePart.mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: "Không thể lưu ảnh" };
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET_NAME).getPublicUrl(filePath);

    console.log("=== NANO BANANA COVER ===");
    console.log(publicUrl);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("Nano Banana error:", error);
    return { success: false, error: errorMessage(error) };
  }
}

/**
 * Dịch tiêu đề sang tiếng Anh, rồi tạo ảnh bìa hoạt hình có đúng câu chữ đó.
 */
export async function generateCoverImageFromTitle(
  title: string,
  aspectRatio: CoverAspectRatio = "16:9"
): Promise<NanoBananaCoverResult> {
  try {
    await requireAdmin();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return { success: false, error: "Thiếu tiêu đề bài viết" };
    }

    let englishTitle = cleanTitle;
    try {
      englishTitle = await translateTitleToEnglish(cleanTitle);
    } catch (error) {
      console.warn("Translation failed:", error);
    }
    console.log("Translated title:", englishTitle);

    const imagePrompt = `
Cartoon illustration style, running theme, vibrant colors, energetic atmosphere.
Scene: illustrate this title literally: "${englishTitle}". A runner in action, dynamic pose, running shoes visible, outdoor setting.
The image MUST contain the text "${englishTitle}" prominently displayed,
in a clean, readable font, integrated naturally into the composition.
No other text in the image. Professional blog cover quality.
    `.trim();

    console.log("Trying Nano Banana 2...");
    const nanoResult = await generateCoverImageWithNanoBanana(imagePrompt, aspectRatio);
    if (nanoResult.success) {
      console.log("Nano Banana 2 succeeded");
      return { success: true, url: nanoResult.url, usedFallback: false };
    }

    console.warn("Nano Banana failed, falling back to Unsplash:", nanoResult.error);
    const unsplashResult = await generateCoverImageWithUnsplash(cleanTitle, englishTitle);
    if (unsplashResult.success && unsplashResult.url) {
      console.log("Fallback Unsplash succeeded");
      return { success: true, url: unsplashResult.url, usedFallback: true };
    }

    console.error("Both Nano Banana and Unsplash failed");
    return { success: false, error: "Không thể tạo ảnh bìa. Vui lòng thử lại sau." };
  } catch (error) {
    console.error("Nano Banana error:", error);
    return { success: false, error: errorMessage(error) };
  }
}

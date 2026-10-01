"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { isEmptyEditorContent } from "@/lib/utils/editorjs";
import {
  fetchPublicPageText,
  parsePublicHttpUrl,
} from "@/lib/utils/fetchPublicPage";

export type GeneratePostFromUrlResult =
  | {
      success: true;
      title: string;
      content: string;
      coverImageUrl: string;
      authorId: string;
    }
  | { success: false; error: string };

/**
 * Ảnh Unsplash đã kiểm tra, nhóm theo chủ đề.
 * source.unsplash.com trả HTTP 503 từ 2024 nên không tìm ảnh bằng URL đó.
 * Gemini tạo từ khóa tiếng Anh, rồi map sang nhóm ảnh khớp nội dung.
 */
const COVER_TOPICS = [
  {
    id: "hydration",
    terms: [
      "drinking water",
      "water bottle",
      "sports drink",
      "hydration",
      "hydrate",
      "electrolyte",
      "uong nuoc",
      "nuoc uong",
      "dien giai",
      "thirst",
      "water",
      "drink",
      "uong",
      "nuoc",
    ],
    photos: [
      "photo-1523362628745-0c100150b504",
      "photo-1548839140-29a749e1cf4d",
      "photo-1602143407151-7111542de6e8",
    ],
  },
  {
    id: "nutrition",
    terms: [
      "healthy food",
      "nutrition",
      "protein",
      "meal",
      "diet",
      "dinh duong",
      "thuc pham",
      "bua an",
      "food",
    ],
    photos: [
      "photo-1490645935967-10de6ba17061",
      "photo-1512621776951-a57141f2eefd",
      "photo-1546069901-ba9599a7e63c",
    ],
  },
  {
    id: "stretch",
    terms: [
      "stretching",
      "stretch",
      "warmup",
      "warm up",
      "mobility",
      "flexibility",
      "gian co",
      "khoi dong",
      "yoga",
    ],
    photos: [
      "photo-1544367567-0f2fcb009e0b",
      "photo-1483721310020-03333e577078",
    ],
  },
  {
    id: "technique",
    terms: [
      "running form",
      "proper posture",
      "runner technique",
      "footstrike",
      "stride",
      "cadence",
      "ky thuat",
      "tu the",
      "dang chay",
      "sai chan",
      "posture",
      "technique",
    ],
    photos: [
      "photo-1571008887538-b36bb32f4571",
      "photo-1476480862126-209bfaa8edc8",
      "photo-1486218119243-13883505764c",
    ],
  },
  {
    id: "peaceful",
    terms: [
      "peaceful running",
      "solo runner",
      "peaceful",
      "sunrise",
      "mindful",
      "calm",
      "stress",
      "binh yen",
      "mot minh",
      "tinh than",
      "giam stress",
    ],
    photos: [
      "photo-1707326508037-d1fbd699f129",
      "photo-1486218119243-13883505764c",
      "photo-1513593771513-7b58b6c4af38",
    ],
  },
  {
    id: "race",
    terms: ["marathon", "finish line", "giai chay", "duong dua", "race"],
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

function plainExcerpt(value: string, max = 500): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function scoreTerms(text: string, terms: readonly string[]): number {
  const haystack = ` ${normalizeSearchText(text)} `;
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(` ${term} `)) score += term.length;
  }
  return score;
}

function extractKeywords(title: string): string {
  return (
    normalizeSearchText(title)
      .split(" ")
      .filter((word) => word.length > 3)
      .slice(0, 3)
      .join(",") || "running,marathon,fitness"
  );
}

function coverIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

function pickCoverPhotos(keywords: string, title: string, content: string): readonly string[] {
  let bestScore = 0;
  let bestPhotos: readonly string[] = DEFAULT_COVERS;

  for (const topic of COVER_TOPICS) {
    const score =
      scoreTerms(keywords, topic.terms) * 3 +
      scoreTerms(title, topic.terms) * 2 +
      scoreTerms(plainExcerpt(content), topic.terms);
    if (score > bestScore) {
      bestScore = score;
      bestPhotos = topic.photos;
    }
  }

  return bestPhotos;
}

function unsplashPhotoId(url: string): string | null {
  const match = /\/(photo-[0-9]+-[a-z0-9]+)/i.exec(url);
  return match?.[1] ?? null;
}

function buildCoverImageUrl(
  title: string,
  content: string,
  keywords: string,
  seed: number,
  excludeUrl = ""
): string {
  const topicPhotos = pickCoverPhotos(keywords, title, content);
  const excludedId = unsplashPhotoId(excludeUrl);
  let photos = topicPhotos.filter((id) => id !== excludedId);
  if (photos.length === 0) {
    photos = DEFAULT_COVERS.filter((id) => id !== excludedId);
  }
  if (photos.length === 0) {
    photos = [...topicPhotos];
  }

  const photoId = photos[coverIndex(`${keywords}:${seed}`, photos.length)];
  const imageUrl = `https://images.unsplash.com/${photoId}?w=1200&h=675&fit=crop&q=80&auto=format`;
  console.log("=== COVER IMAGE ===");
  console.log(keywords);
  console.log(seed, photoId);
  return imageUrl;
}

async function generateImagePrompt(title: string, content: string): Promise<string> {
  const fallback = extractKeywords(title);
  const genAI = getGeminiClient();
  if (!genAI) return fallback;

  const excerpt = plainExcerpt(content);
  const prompt = `Bạn là chuyên gia tạo prompt ảnh cho blog về chạy bộ.

Tiêu đề bài viết: "${title}"
Nội dung tóm tắt: "${excerpt}"

Hãy tạo MỘT mô tả ảnh (bằng tiếng Anh) ngắn gọn, súc tích (3-6 từ khóa) để tìm ảnh trên Unsplash sao cho PHÙ HỢP NHẤT với nội dung bài viết.

Yêu cầu:
- Chỉ trả về các từ khóa tiếng Anh, cách nhau bằng dấu phẩy
- Không giải thích, không thêm text khác
- Ưu tiên các từ khóa mô tả HÀNH ĐỘNG cụ thể (ví dụ: "person drinking water", "runner stretching", "marathon race")
- Nếu bài viết về dinh dưỡng → ảnh về đồ ăn, uống nước
- Nếu bài viết về kỹ thuật chạy → ảnh về tư thế chạy
- Nếu bài viết về tinh thần → ảnh về người chạy một mình

Ví dụ:
- Tiêu đề "Bí quyết uống nước đúng cách" → "runner drinking water, hydration, sports drink"
- Tiêu đề "Kỹ thuật chạy bộ đúng" → "running form, proper posture, runner technique"
- Tiêu đề "Chạy bộ giảm stress" → "peaceful running, sunrise run, solo runner"

Chỉ trả về từ khóa, không thêm gì khác.`;

  for (const modelName of resolveGeminiModels()) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 80,
        },
      });
      const result = await model.generateContent(prompt);
      const keywords = result.response
        .text()
        .replace(/[^a-zA-Z0-9,\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);
      if (keywords) {
        console.log("=== COVER KEYWORDS ===");
        console.log(modelName, keywords);
        return keywords;
      }
    } catch (error) {
      console.warn("Failed to generate image prompt, trying next model:", error);
    }
  }

  console.warn("Failed to generate image prompt, using fallback:", fallback);
  return fallback;
}

/**
 * Tạo ảnh bìa 16:9 (1200x675) khớp tiêu đề và nội dung.
 * seed đổi ảnh mỗi lần bấm; excludeUrl là ảnh hiện tại, ảnh mới sẽ khác ảnh đó.
 * source.unsplash.com trả HTTP 503 nên dùng images.unsplash.com.
 */
export async function generateCoverImage(
  title: string,
  content = "",
  seed?: number,
  excludeUrl = ""
): Promise<string> {
  await requireAdmin();
  const keywords = await generateImagePrompt(title, content);
  const imageSeed =
    typeof seed === "number" && Number.isFinite(seed)
      ? Math.trunc(seed)
      : Date.now() + Math.floor(Math.random() * 1_000_000);
  return buildCoverImageUrl(title, content, keywords, imageSeed, excludeUrl);
}

function toStoredHtml(html: string): string {
  const cleaned = cleanHtmlContent(html.trim());
  if (!cleaned) return "";
  if (cleaned.startsWith("<")) return cleaned;
  return `<p>${cleaned}</p>`;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readJsonString(record: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseAIResponse(response: string): { title: string; content: string } | null {
  const cleanResponse = response
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  const objectMatch = /\{[\s\S]*\}/.exec(cleanResponse);
  const candidates = [cleanResponse];
  if (objectMatch?.[0] && objectMatch[0] !== cleanResponse) {
    candidates.push(objectMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (!isRecord(parsed)) continue;

      const title = readJsonString(parsed, ["title", "Title"]);
      const content = readJsonString(parsed, [
        "content",
        "contentHtml",
        "Content",
        "ContentHtml",
        "html",
      ]);

      if (title && content) {
        return { title: title.slice(0, 100), content };
      }
    } catch (error) {
      console.warn("JSON parse failed:", error);
    }
  }

  const titleMatch = response.match(/---TITLE---\s*([\s\S]*?)\s*---CONTENT---/);
  const contentMatch = response.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);
  if (titleMatch?.[1] && contentMatch?.[1]) {
    const title = titleMatch[1].trim();
    const content = contentMatch[1].trim();
    if (title && content) {
      return { title: title.slice(0, 100), content };
    }
  }

  console.error("Cannot parse AI response:", response.slice(0, 500));
  return null;
}

const AI_BUSY_MESSAGE =
  "Hệ thống AI đang bận, vui lòng thử lại sau 1-2 phút.";

const MAX_URL_LENGTH = 2_000;
const MAX_SOURCE_CHARS = 30_000;
const JINA_TIMEOUT_MS = 15_000;
const MIN_SOURCE_CHARS = 200;

const UNREADABLE_LINK_MESSAGE =
  "Không đọc được nội dung từ link này. Hãy thử link bài báo hoặc blog công khai.";

// Danh sách model AI theo thứ tự ưu tiên.
// Chỉ dùng các model còn được Google hỗ trợ.
// gemini-2.5-flash khai tử ngày 20/10/2026; gemini-2.5-flash-lite đã bị gỡ.
const DEFAULT_GEMINI_MODELS = [
  "gemini-3.5-flash", // Model chính — mới nhất, chưa có lịch khai tử
  "gemini-3.5-flash-lite", // Model dự phòng — nhẹ hơn
] as const;

const RETRY_DELAYS_MS = [2_000, 4_000, 6_000];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }
  return "Lỗi không xác định";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getHttpStatus(error: unknown): number | null {
  if (isRecord(error) && typeof error.status === "number") {
    return error.status;
  }
  if (isRecord(error) && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  const match = /\b(429|500|503|404)\b/.exec(errorMessage(error));
  return match ? Number(match[1]) : null;
}

function isRetryableError(error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status === 429 || status === 500 || status === 503) return true;
  return /503|unavailable|overloaded|resource exhausted|high demand|try again later|too many requests/i.test(
    errorMessage(error)
  );
}

function isModelUnavailable(error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status === 429 || status === 500 || status === 503) return false;
  if (status === 404) return true;
  return /not found|no longer available|not supported|not available to new users/i.test(
    errorMessage(error)
  );
}

function validateArticleUrl(raw: string): URL | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "Vui lòng nhập link bài viết" };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return { error: "Link quá dài (tối đa 2000 ký tự)." };
  }

  const url = parsePublicHttpUrl(trimmed);
  if (!url) {
    return {
      error: "URL không hợp lệ. Chỉ chấp nhận link http hoặc https công khai.",
    };
  }

  return url;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SOURCE_CHARS);
}

async function fetchArticleContent(url: URL): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url.toString()}`, {
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "text",
      },
      signal: AbortSignal.timeout(JINA_TIMEOUT_MS),
      cache: "no-store",
    });

    if (response.ok) {
      const content = (await response.text()).trim();
      if (content.length > MIN_SOURCE_CHARS) {
        return content.slice(0, MAX_SOURCE_CHARS);
      }
    }
  } catch (error) {
    console.warn("Jina failed, trying direct fetch:", error);
  }

  try {
    const pageText = await fetchPublicPageText(url);
    if (pageText.length > MIN_SOURCE_CHARS) {
      return pageText.slice(0, MAX_SOURCE_CHARS);
    }
  } catch (error) {
    console.warn("Safe page fetch failed, trying direct HTML strip:", error);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CMC-Running-Bot/1.0)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(JINA_TIMEOUT_MS),
    redirect: "manual",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Không thể đọc link (${response.status})`);
  }

  const text = stripHtmlToText(await response.text());
  if (text.length <= MIN_SOURCE_CHARS) {
    throw new Error(UNREADABLE_LINK_MESSAGE);
  }
  return text;
}

function resolveGeminiModels(): string[] {
  const retired = new Set<string>([
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ]);
  const fromEnv = process.env.GEMINI_MODEL?.split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && !retired.has(name));

  if (fromEnv && fromEnv.length > 0) {
    return [...new Set(fromEnv)];
  }

  return [...DEFAULT_GEMINI_MODELS];
}

async function generateWithRetries(
  genAI: GoogleGenerativeAI,
  modelName: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
      responseMimeType: "application/json",
    },
  });

  const maxAttempts = RETRY_DELAYS_MS.length + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      console.log("=== AI RAW RESPONSE ===");
      console.log(response.slice(0, 500));
      console.log("=== END ===");
      return response;
    } catch (error) {
      lastError = error;
      if (isModelUnavailable(error) || !isRetryableError(error)) {
        throw error;
      }
      if (attempt >= RETRY_DELAYS_MS.length) {
        throw error;
      }
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError ?? new Error("Gemini failed");
}

export async function generatePostFromUrl(
  url: string
): Promise<GeneratePostFromUrlResult> {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  const parsedUrl = validateArticleUrl(url);
  if ("error" in parsedUrl) {
    return { success: false, error: parsedUrl.error };
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    return { success: false, error: "Chưa cấu hình GEMINI_API_KEY" };
  }

  let pageText: string;
  try {
    pageText = await fetchArticleContent(parsedUrl);
  } catch (error) {
    return { success: false, error: errorMessage(error) };
  }

  const modelCandidates = resolveGeminiModels();

  const prompt = `Bạn là biên tập viên câu lạc bộ chạy bộ CMC Global.
Đọc nội dung nguồn (text đã trích từ bài viết) và viết lại thành bài cho cộng đồng CLB.

Yêu cầu:
- title: tiếng Việt, hấp dẫn, tối đa 100 ký tự.
- content: tiếng Việt, 300-800 từ, giọng thân thiện, truyền cảm hứng, là HTML.
- Chỉ dùng các thẻ: p, h2, h3, ul, ol, li, blockquote.
- Không bịa số liệu. Nếu nguồn không đủ, tổng hợp những gì có.
- Không sao chép nguyên văn dài. Không thêm quảng cáo.

Trả về kết quả dưới dạng JSON với cấu trúc CHÍNH XÁC như sau:
{
  "title": "Tiêu đề bài viết",
  "content": "<p>Nội dung HTML</p>"
}

Lưu ý: Key phải là "title" và "content" (chữ thường), không dùng "contentHtml" hay bất kỳ tên nào khác.

Nguồn URL: ${parsedUrl.toString()}

Nội dung nguồn:
"""
${pageText}
"""`;

  try {
    let text = "";

    for (const modelName of modelCandidates) {
      try {
        text = await generateWithRetries(genAI, modelName, prompt);
        break;
      } catch (error) {
        console.error(`[generatePostFromUrl] ${modelName}`, error);
        if (!isModelUnavailable(error) && !isRetryableError(error)) {
          throw error;
        }
      }
    }

    if (!text) {
      return { success: false, error: AI_BUSY_MESSAGE };
    }

    const draft = parseAIResponse(text);
    if (!draft) {
      return {
        success: false,
        error:
          "AI trả về kết quả không đúng định dạng. Vui lòng thử lại với link khác.",
      };
    }

    const content = toStoredHtml(draft.content);
    if (isEmptyEditorContent(content)) {
      return { success: false, error: "AI không tạo được nội dung hợp lệ" };
    }

    return {
      success: true,
      title: draft.title,
      content,
      coverImageUrl: await generateCoverImage(draft.title, content),
      authorId: adminUser.id,
    };
  } catch (error) {
    console.error("[generatePostFromUrl]", error);
    if (isRetryableError(error) || isModelUnavailable(error)) {
      return { success: false, error: AI_BUSY_MESSAGE };
    }
    return { success: false, error: `Không thể tạo bài viết: ${errorMessage(error)}` };
  }
}

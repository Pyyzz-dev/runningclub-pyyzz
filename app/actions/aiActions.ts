"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateCoverImageFromTitle } from "@/app/actions/nanoBananaActions";
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
      imagePrompt: string;
      coverImageUrl: string;
      usedFallback: boolean;
      authorId: string;
    }
  | { success: false; error: string };

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

const MAX_TITLE_WORDS = 7;

function limitTitleWords(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, MAX_TITLE_WORDS).join(" ");
}

function fallbackImagePrompt(title: string): string {
  return `Friendly cartoon illustration about running. The scene must match this title exactly: a runner whose action illustrates "${title}". with the text "${title}" written on it.`;
}

function alignImagePrompt(imagePrompt: string, title: string): string {
  const prompt = imagePrompt.trim();
  if (!prompt) return fallbackImagePrompt(title);
  if (prompt.includes(`"${title}"`)) return prompt;
  return `${prompt}\nwith the text "${title}" written on it.`;
}

function readJsonString(record: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readLooseJsonString(source: string, key: string): string {
  const marker = new RegExp(`"${key}"\\s*:\\s*"`, "i").exec(source);
  if (!marker) return "";

  const valueStart = marker.index + marker[0].length;
  for (let index = valueStart; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] !== '"') continue;
    const rest = source.slice(index + 1).trimStart();
    if (rest.startsWith(",") || rest.startsWith("}")) {
      return source
        .slice(valueStart, index)
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .trim();
    }
  }

  return "";
}

function draftFromLooseJson(
  source: string
): { title: string; content: string; imagePrompt: string } | null {
  const title = limitTitleWords(readLooseJsonString(source, "title"));
  const content =
    readLooseJsonString(source, "content") || readLooseJsonString(source, "contentHtml");
  const imagePrompt =
    readLooseJsonString(source, "image_prompt") || readLooseJsonString(source, "imagePrompt");

  if (!title || !content) return null;
  return { title, content, imagePrompt: alignImagePrompt(imagePrompt, title) };
}

function parseAIResponse(
  response: string
): { title: string; content: string; imagePrompt: string } | null {
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

      const title = limitTitleWords(readJsonString(parsed, ["title", "Title"]));
      const content = readJsonString(parsed, [
        "content",
        "contentHtml",
        "Content",
        "ContentHtml",
        "html",
      ]);
      const imagePrompt = readJsonString(parsed, ["image_prompt", "imagePrompt", "ImagePrompt"]);

      if (title && content) {
        return { title, content, imagePrompt: alignImagePrompt(imagePrompt, title) };
      }
    } catch (error) {
      console.warn("JSON parse failed:", error);
      const loose = draftFromLooseJson(candidate);
      if (loose) return loose;
    }
  }

  const titleMatch = response.match(/---TITLE---\s*([\s\S]*?)\s*---CONTENT---/);
  const contentMatch = response.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);
  if (titleMatch?.[1] && contentMatch?.[1]) {
    const title = limitTitleWords(titleMatch[1]);
    const content = contentMatch[1].trim();
    if (title && content) {
      return { title, content, imagePrompt: alignImagePrompt("", title) };
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
      maxOutputTokens: 8000,
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

  const prompt = `Bạn là biên tập viên cho CLB chạy bộ CMC Global.
Đọc nội dung nguồn và viết lại thành bài cho cộng đồng CLB.

Nhiệm vụ 1: Tạo tiêu đề (title) cho bài viết.
Yêu cầu: Ngắn gọn, súc tích, KHÔNG QUÁ 7 TỪ.
Phải truyền tải được nội dung chính của bài viết.

Nhiệm vụ 2: Viết nội dung (content).
Yêu cầu: tiếng Việt, 300-800 từ, giọng thân thiện, truyền cảm hứng, là HTML.
Chỉ dùng các thẻ: p, h2, h3, ul, ol, li, blockquote.
Không bịa số liệu. Nếu nguồn không đủ, tổng hợp những gì có.
Không sao chép nguyên văn dài. Không thêm quảng cáo.

Nhiệm vụ 3: Tạo mô tả (image_prompt) cho ảnh bìa.
Phong cách: Hoạt hình (cartoon/illustration), thân thiện, liên quan đến chạy bộ.
Yêu cầu: Phải dựa HOÀN TOÀN trên tiêu đề vừa tạo.
Ví dụ: Nếu title là "Bí quyết uống nước trong race", image_prompt phải mô tả cảnh "một runner đang chạy trong cuộc đua và uống nước".
QUAN TRỌNG: Trong image_prompt, hãy yêu cầu AI chèn CHÍNH XÁC toàn bộ tiêu đề (title) vào ảnh. Ví dụ: with the text "Bí quyết uống nước trong race" written on it.

Trả về kết quả dưới dạng JSON. Viết title và image_prompt trước, content sau:
{
  "title": "...",
  "image_prompt": "...",
  "content": "..."
}

Key phải là "title", "content" và "image_prompt" (chữ thường).

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

    const imageResult = await generateCoverImageFromTitle(draft.title, "16:9");
    if (!imageResult.success) {
      console.error("[generatePostFromUrl] cover", imageResult.error);
    }

    return {
      success: true,
      title: draft.title,
      content,
      imagePrompt: draft.imagePrompt,
      coverImageUrl: imageResult.success ? imageResult.url : "",
      usedFallback: imageResult.success ? imageResult.usedFallback : false,
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

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
      authorId: string;
    }
  | { success: false; error: string };

type GeminiDraft = {
  title: string;
  contentHtml: string;
};

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

function parseGeminiDraft(raw: string): GeminiDraft | null {
  const trimmed = raw.trim();
  const jsonMatch = /\{[\s\S]*\}/.exec(trimmed);
  const jsonText = jsonMatch?.[0] ?? trimmed;

  try {
    const parsed: unknown = JSON.parse(jsonText);
    if (!isRecord(parsed)) return null;
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const contentHtml =
      typeof parsed.contentHtml === "string" ? parsed.contentHtml.trim() : "";
    if (!title || !contentHtml) return null;
    return { title: title.slice(0, 100), contentHtml };
  } catch {
    const titleMatch = raw.match(/---TITLE---\s*([\s\S]*?)\s*---CONTENT---/);
    const contentMatch = raw.match(/---CONTENT---\s*([\s\S]*?)\s*---END---/);
    if (!titleMatch || !contentMatch) return null;
    const title = titleMatch[1].trim().slice(0, 100);
    const contentHtml = contentMatch[1].trim();
    if (!title || !contentHtml) return null;
    return { title, contentHtml };
  }
}

const AI_BUSY_MESSAGE =
  "Hệ thống AI đang bận, vui lòng thử lại sau 1-2 phút.";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash",
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

function resolveGeminiModels(): string[] {
  const fromEnv = process.env.GEMINI_MODEL?.split(",")
    .map((name) => name.trim())
    .filter(Boolean);

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
      return result.response.text();
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

  const parsedUrl = parsePublicHttpUrl(url);
  if (!parsedUrl) {
    return { success: false, error: "URL không hợp lệ" };
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    return { success: false, error: "Chưa cấu hình GEMINI_API_KEY" };
  }

  let pageText: string;
  try {
    pageText = await fetchPublicPageText(parsedUrl);
  } catch (error) {
    return { success: false, error: `Không đọc được link: ${errorMessage(error)}` };
  }

  const modelCandidates = resolveGeminiModels();

  const prompt = `Bạn là biên tập viên câu lạc bộ chạy bộ CMC Global.
Đọc nội dung nguồn (có thể chứa HTML đã được làm sạch thành text) và viết lại thành bài cho cộng đồng CLB.

Yêu cầu:
- title: tiếng Việt, hấp dẫn, tối đa 100 ký tự.
- contentHtml: tiếng Việt, 300-800 từ, giọng thân thiện, truyền cảm hứng.
- Chỉ dùng các thẻ: p, h2, h3, ul, ol, li, blockquote.
- Không bịa số liệu. Nếu nguồn không đủ, tổng hợp những gì có.
- Không sao chép nguyên văn dài. Không thêm quảng cáo.

Trả về JSON đúng schema:
{"title":"...","contentHtml":"<p>...</p>"}

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

    const draft = parseGeminiDraft(text);
    if (!draft) {
      return { success: false, error: "Không thể đọc kết quả từ AI" };
    }

    const content = toStoredHtml(draft.contentHtml);
    if (isEmptyEditorContent(content)) {
      return { success: false, error: "AI không tạo được nội dung hợp lệ" };
    }

    return {
      success: true,
      title: draft.title,
      content,
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

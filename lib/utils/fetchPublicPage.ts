const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 400_000;
const MAX_TEXT_CHARS = 18_000;
const MAX_REDIRECTS = 5;

function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  );
}

export function parsePublicHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const hostname = url.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      isPrivateIPv4(hostname)
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPageText(html: string): string {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch ? stripHtmlToText(titleMatch[1]) : "";
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  const bodyText = stripHtmlToText(bodyMatch?.[1] ?? html);
  return [title ? `Tiêu đề trang: ${title}` : "", bodyText]
    .filter(Boolean)
    .join("\n\n");
}

export async function fetchPublicPageText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let current = url;
    let response: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!parsePublicHttpUrl(current.toString())) {
        throw new Error("URL không hợp lệ");
      }

      response = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        cache: "no-store",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent":
            "Mozilla/5.0 (compatible; CLBChayBoBot/1.0; +https://clbchaybocmcglobal.vn)",
        },
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        break;
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Không tải được trang (${response.status})`);
      }

      current = new URL(location, current);
    }

    if (!response || !response.ok) {
      throw new Error(`Không tải được trang (${response?.status ?? 0})`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)) {
      throw new Error("Link không phải trang HTML");
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new Error("Trang quá dài để đọc tự động");
    }

    const html = new TextDecoder("utf-8").decode(buffer);
    const combined = extractPageText(html);

    if (combined.length < 80) {
      throw new Error("Không đọc được nội dung đủ từ link này");
    }

    return combined.slice(0, MAX_TEXT_CHARS);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Hết thời gian đọc link");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

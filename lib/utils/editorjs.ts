import { cleanHtmlContent } from "@/lib/utils/cleanHtml";

interface EditorJsBlock {
  type: string;
  data: Record<string, unknown>;
}

interface EditorJsOutput {
  blocks: EditorJsBlock[];
}

export function isEditorJsContent(value: string): boolean {
  if (!value?.trim()) return false;
  try {
    const json = JSON.parse(value) as EditorJsOutput;
    return Array.isArray(json.blocks);
  } catch {
    return false;
  }
}

function getListItemHtml(item: unknown): string {
  if (typeof item === "string") {
    return `<li>${item}</li>`;
  }
  if (item && typeof item === "object" && "content" in item) {
    const content = String((item as { content: string }).content);
    const nested = (item as { items?: unknown[] }).items;
    if (Array.isArray(nested) && nested.length > 0) {
      const nestedHtml = nested.map(getListItemHtml).join("");
      return `<li>${content}<ul>${nestedHtml}</ul></li>`;
    }
    return `<li>${content}</li>`;
  }
  return "";
}

export function parseEditorJsContent(data: string): string {
  const raw =
    typeof data === "string"
      ? data
      : data == null
        ? ""
        : JSON.stringify(data);
  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return "";

  if (trimmed.startsWith("<")) {
    return cleanHtmlContent(trimmed);
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    const json = typeof parsed === "string" ? (JSON.parse(parsed) as unknown) : parsed;
    if (!isEditorJsOutput(json)) return trimmed;

    return json.blocks
      .map((block) => blockToHtml(block))
      .join("");
  } catch {
    return trimmed;
  }
}

function isEditorJsOutput(value: unknown): value is EditorJsOutput {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as EditorJsOutput).blocks)
  );
}

function blockToHtml(block: EditorJsBlock): string {
  const data = block.data ?? {};
  switch (block.type) {
    case "header": {
      const level = Number(data.level) || 2;
      const text = String(data.text ?? "");
      return `<h${level}>${text}</h${level}>`;
    }
    case "paragraph":
      return `<p>${String(data.text ?? "")}</p>`;
    case "list": {
      const items = Array.isArray(data.items)
        ? data.items.map(getListItemHtml).join("")
        : "";
      return data.style === "ordered" ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
    }
    case "image": {
      const file = data.file as { url?: string } | undefined;
      const url = file?.url ?? String(data.url ?? "");
      if (!url) return "";
      const caption = data.caption
        ? `<figcaption>${String(data.caption)}</figcaption>`
        : "";
      return `<figure class="my-4"><img src="${url}" alt="" class="max-w-full h-auto rounded-lg" />${caption}</figure>`;
    }
    case "quote": {
      const text = String(data.text ?? "");
      const caption = data.caption
        ? `<cite>${String(data.caption)}</cite>`
        : "";
      return `<blockquote>${text}${caption}</blockquote>`;
    }
    case "embed": {
      const embed = String(data.embed ?? "");
      if (embed) {
        return `<div class="my-4 aspect-video overflow-hidden rounded-lg">${embed}</div>`;
      }
      const source = String(data.source ?? "");
      return source
        ? `<p><a href="${source}" target="_blank" rel="noopener noreferrer">${source}</a></p>`
        : "";
    }
    default:
      return "";
  }
}

export function getPostExcerpt(content: string, maxLength = 120): string {
  const html = parseEditorJsContent(content);
  const fromHtml = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (fromHtml && !fromHtml.startsWith("{") && !fromHtml.includes('"blocks"')) {
    return fromHtml.length <= maxLength
      ? fromHtml
      : `${fromHtml.slice(0, maxLength).trim()}...`;
  }

  try {
    const parsed: unknown = JSON.parse(
      typeof content === "string" ? content : JSON.stringify(content ?? "")
    );
    if (!isEditorJsOutput(parsed)) {
      return fromHtml.slice(0, maxLength);
    }
    const parts: string[] = [];
    for (const block of parsed.blocks) {
      const data = block.data ?? {};
      if (typeof data.text === "string" && data.text.trim()) {
        parts.push(data.text.replace(/<[^>]*>/g, " ").trim());
      }
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (typeof item === "string") parts.push(item);
          if (item && typeof item === "object" && "content" in item) {
            parts.push(String((item as { content: string }).content));
          }
        }
      }
    }
    const joined = parts.join(" ").replace(/\s+/g, " ").trim();
    if (!joined) return fromHtml.slice(0, maxLength);
    return joined.length <= maxLength
      ? joined
      : `${joined.slice(0, maxLength).trim()}...`;
  } catch {
    return fromHtml.slice(0, maxLength);
  }
}

export function renderEditorContent(content: string): string {
  if (!content?.trim()) return "";
  return parseEditorJsContent(content);
}

export function normalizeContentForSave(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (isEditorJsContent(trimmed)) {
    return parseEditorJsContent(trimmed);
  }
  return cleanHtmlContent(trimmed);
}

function getBlockPlainText(block: EditorJsBlock): string {
  switch (block.type) {
    case "header":
    case "paragraph":
    case "quote":
      return String(block.data.text ?? "").trim();
    case "list":
      if (!Array.isArray(block.data.items)) return "";
      return block.data.items
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "content" in item) {
            return String((item as { content: string }).content);
          }
          return "";
        })
        .join(" ")
        .trim();
    default:
      return "";
  }
}

export function isEmptyEditorContent(value: string): boolean {
  if (!value?.trim()) return true;

  if (isEditorJsContent(value)) {
    const json = JSON.parse(value) as EditorJsOutput;
    if (!json.blocks?.length) return true;
    return json.blocks.every((block) => {
      if (block.type === "image" || block.type === "embed") return false;
      return !getBlockPlainText(block);
    });
  }

  const text = value.replace(/<[^>]*>/g, "").trim();
  return !text || value === "<p></p>";
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'");
}

function imageBlock(url: string, caption = ""): EditorJsBlock | null {
  const cleanUrl = decodeHtmlEntities(url).trim();
  if (!cleanUrl) return null;
  return {
    type: "image",
    data: {
      caption,
      withBorder: false,
      withBackground: false,
      stretched: false,
      file: { url: cleanUrl },
    },
  };
}

function readImageUrl(data: Record<string, unknown>): string {
  const file = data.file;
  if (typeof file === "string") return decodeHtmlEntities(file).trim();
  if (file && typeof file === "object" && "url" in file) {
    const url = (file as { url?: unknown }).url;
    if (typeof url === "string") return decodeHtmlEntities(url).trim();
  }
  if (typeof data.url === "string") return decodeHtmlEntities(data.url).trim();
  if (typeof data.src === "string") return decodeHtmlEntities(data.src).trim();
  return "";
}

function normalizeImageBlock(block: EditorJsBlock): EditorJsBlock | null {
  const url = readImageUrl(block.data ?? {});
  if (!url) return null;
  const caption = typeof block.data?.caption === "string" ? block.data.caption : "";
  return {
    ...block,
    type: "image",
    data: {
      caption,
      withBorder: block.data?.withBorder === true,
      withBackground: block.data?.withBackground === true,
      stretched: block.data?.stretched === true,
      file: { url },
    },
  };
}

function appendHtmlWithImages(
  blocks: EditorJsBlock[],
  html: string,
  caption = ""
): void {
  const imgRegex = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(html)) !== null) {
    const before = html
      .slice(lastIndex, match.index)
      .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (before) {
      blocks.push({ type: "paragraph", data: { text: before } });
    }
    const block = imageBlock(match[1], caption);
    if (block) blocks.push(block);
    lastIndex = match.index + match[0].length;
  }

  const after = html
    .slice(lastIndex)
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (after) {
    blocks.push({ type: "paragraph", data: { text: after } });
  }
}

function htmlToEditorBlocks(html: string): EditorJsOutput {
  const blocks: EditorJsBlock[] = [];
  const chunkRegex =
    /<(h[2-4]|p|blockquote|ul|ol|figure)\b[^>]*>[\s\S]*?<\/\1>|<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = chunkRegex.exec(html)) !== null) {
    found = true;
    const full = match[0];
    if (/^<img\b/i.test(full)) {
      const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(full);
      const block = src ? imageBlock(src[1]) : null;
      if (block) blocks.push(block);
      continue;
    }

    const tag = match[1].toLowerCase();
    const inner = full
      .replace(new RegExp(`^<${tag}\\b[^>]*>`, "i"), "")
      .replace(new RegExp(`</${tag}>$`, "i"), "");

    if (tag === "ul" || tag === "ol") {
      const items: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(inner)) !== null) {
        const text = liMatch[1].replace(/<[^>]+>/g, "").trim();
        if (text) items.push(text);
      }
      if (items.length > 0) {
        blocks.push({
          type: "list",
          data: {
            style: tag === "ol" ? "ordered" : "unordered",
            items,
          },
        });
      }
      continue;
    }

    if (tag === "figure") {
      const caption =
        /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i
          .exec(inner)?.[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() ?? "";
      appendHtmlWithImages(blocks, inner, caption);
      continue;
    }

    if (tag.startsWith("h")) {
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) {
        blocks.push({
          type: "header",
          data: { text, level: Number(tag[1]) },
        });
      }
      continue;
    }

    if (tag === "blockquote") {
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (text) {
        blocks.push({ type: "quote", data: { text, caption: "" } });
      }
      continue;
    }

    appendHtmlWithImages(blocks, inner);
  }

  if (!found) {
    appendHtmlWithImages(blocks, html);
  }

  return { blocks };
}

export function htmlToEditorJsJson(html: string): string {
  return JSON.stringify(
    htmlToEditorBlocks(
      html.replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "").trim()
    )
  );
}

export function parseEditorValue(value: string): EditorJsOutput {
  if (!value?.trim()) return { blocks: [] };

  try {
    if (isEditorJsContent(value)) {
      const json = JSON.parse(value) as EditorJsOutput;
      return {
        blocks: json.blocks.flatMap((block) => {
          if (block.type !== "image") return [block];
          const normalized = normalizeImageBlock(block);
          return normalized ? [normalized] : [];
        }),
      };
    }
  } catch (error) {
    console.warn("JSON parse failed:", error);
  }

  return htmlToEditorBlocks(cleanHtmlContent(value));
}

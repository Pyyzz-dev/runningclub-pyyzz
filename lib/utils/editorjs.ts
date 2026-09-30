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

function htmlToEditorBlocks(html: string): EditorJsOutput {
  const blocks: EditorJsBlock[] = [];
  const chunkRegex = /<(h[2-4]|p|blockquote|ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = chunkRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2];

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

    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) continue;

    if (tag.startsWith("h")) {
      blocks.push({
        type: "header",
        data: { text, level: Number(tag[1]) },
      });
    } else if (tag === "p") {
      blocks.push({ type: "paragraph", data: { text } });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", data: { text, caption: "" } });
    }
  }

  if (blocks.length === 0) {
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push({ type: "paragraph", data: { text } });
    }
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
  if (isEditorJsContent(value)) {
    return JSON.parse(value) as EditorJsOutput;
  }
  return htmlToEditorBlocks(cleanHtmlContent(value));
}

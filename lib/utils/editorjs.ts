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
  try {
    const json = JSON.parse(data) as EditorJsOutput;
    if (!Array.isArray(json.blocks)) return data;

    return json.blocks
      .map((block) => {
        switch (block.type) {
          case "header": {
            const level = Number(block.data.level) || 2;
            const text = String(block.data.text ?? "");
            return `<h${level}>${text}</h${level}>`;
          }
          case "paragraph":
            return `<p>${String(block.data.text ?? "")}</p>`;
          case "list": {
            const items = Array.isArray(block.data.items)
              ? block.data.items.map(getListItemHtml).join("")
              : "";
            return block.data.style === "ordered"
              ? `<ol>${items}</ol>`
              : `<ul>${items}</ul>`;
          }
          case "image": {
            const file = block.data.file as { url?: string } | undefined;
            const url = file?.url ?? String(block.data.url ?? "");
            if (!url) return "";
            const caption = block.data.caption
              ? `<figcaption>${String(block.data.caption)}</figcaption>`
              : "";
            return `<figure class="my-4"><img src="${url}" alt="" class="max-w-full h-auto rounded-lg" />${caption}</figure>`;
          }
          case "quote": {
            const text = String(block.data.text ?? "");
            const caption = block.data.caption
              ? `<cite>${String(block.data.caption)}</cite>`
              : "";
            return `<blockquote>${text}${caption}</blockquote>`;
          }
          case "embed": {
            const embed = String(block.data.embed ?? "");
            if (embed) {
              return `<div class="my-4 aspect-video overflow-hidden rounded-lg">${embed}</div>`;
            }
            const source = String(block.data.source ?? "");
            return source
              ? `<p><a href="${source}" target="_blank" rel="noopener noreferrer">${source}</a></p>`
              : "";
          }
          default:
            return "";
        }
      })
      .join("");
  } catch {
    return data;
  }
}

export function renderEditorContent(content: string): string {
  if (!content?.trim()) return "";
  if (isEditorJsContent(content)) {
    return parseEditorJsContent(content);
  }
  return cleanHtmlContent(content);
}

export function normalizeContentForSave(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (isEditorJsContent(trimmed)) return trimmed;
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
  const blockRegex =
    /<(h[2-4]|p|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const inner = match[2].replace(/<[^>]+>/g, "").trim();
    if (!inner) continue;

    if (tag.startsWith("h")) {
      blocks.push({
        type: "header",
        data: { text: inner, level: Number(tag[1]) },
      });
    } else if (tag === "p") {
      blocks.push({ type: "paragraph", data: { text: inner } });
    } else if (tag === "blockquote") {
      blocks.push({ type: "quote", data: { text: inner, caption: "" } });
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

export function parseEditorValue(value: string): EditorJsOutput {
  if (!value?.trim()) return { blocks: [] };
  if (isEditorJsContent(value)) {
    return JSON.parse(value) as EditorJsOutput;
  }
  return htmlToEditorBlocks(cleanHtmlContent(value));
}

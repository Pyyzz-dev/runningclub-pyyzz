"use client";

import { ImageUploader } from "@/components/admin/ImageUploader";
import type { RichTextEditorProps } from "@/components/admin/rich-text-editor-types";
import { Button } from "@/components/ui/button";
import { cleanHtmlContent } from "@/lib/utils/cleanHtml";
import { cn } from "@/lib/utils";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Ngăn Enter tạo thêm đoạn p rỗng liên tiếp */
const NoEmptyParagraphs = Extension.create({
  name: "noEmptyParagraphs",

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from } = editor.state.selection;
        if ($from.parent.type.name === "paragraph" && $from.parent.textContent === "") {
          return true;
        }
        return false;
      },
    };
  },
});

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Nhập nội dung...",
  className,
  imageFolder = "introduce",
}: RichTextEditorProps) {
  const [showImageUploader, setShowImageUploader] = useState(false);
  const isSyncing = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        paragraph: {
          HTMLAttributes: {
            class: "mb-2",
          },
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg my-2" },
      }),
      Placeholder.configure({ placeholder }),
      NoEmptyParagraphs,
    ],
    content: cleanHtmlContent(content),
    editorProps: {
      attributes: {
        class:
          "min-h-[200px] px-3 py-2 focus:outline-none prose prose-sm max-w-none dark:prose-invert [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:ml-6 [&_ul]:list-disc [&_img]:max-w-full [&_img]:rounded-md",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isSyncing.current) return;

      const raw = ed.getHTML();
      const cleaned = cleanHtmlContent(raw);
      onChange(cleaned);

      if (cleaned !== raw) {
        isSyncing.current = true;
        ed.commands.setContent(cleaned, { emitUpdate: false });
        isSyncing.current = false;
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cleaned = cleanHtmlContent(content);
    if (cleaned !== editor.getHTML()) {
      isSyncing.current = true;
      editor.commands.setContent(cleaned, { emitUpdate: false });
      isSyncing.current = false;
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập URL liên kết:", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(
    (url: string) => {
      if (!editor || !url) return;
      editor.chain().focus().setImage({ src: url }).run();
      setShowImageUploader(false);
    },
    [editor]
  );

  if (!editor) return null;

  const toolbarButtons = [
    {
      icon: Bold,
      label: "In đậm",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: Italic,
      label: "In nghiêng",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: UnderlineIcon,
      label: "Gạch chân",
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      icon: Heading2,
      label: "Tiêu đề H2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      label: "Tiêu đề H3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      icon: List,
      label: "Danh sách",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Danh sách số",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      icon: Link2,
      label: "Liên kết",
      action: setLink,
      active: editor.isActive("link"),
    },
  ];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background dark:border-slate-700 dark:bg-slate-950",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/50 p-1 dark:border-slate-700 dark:bg-slate-900/50">
        {toolbarButtons.map(({ icon: Icon, label, action, active }) => (
          <Button
            key={label}
            type="button"
            variant={active ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={action}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        <Button
          type="button"
          variant={showImageUploader ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowImageUploader((v) => !v)}
          title="Chèn ảnh"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      {showImageUploader && (
        <div className="border-b bg-muted/30 p-3 dark:bg-slate-900/30">
          <ImageUploader
            folder={imageFolder}
            onImageUploaded={addImage}
            showPreview={false}
            label="Chọn ảnh để chèn vào nội dung"
          />
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

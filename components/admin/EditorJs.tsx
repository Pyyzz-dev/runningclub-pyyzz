"use client";

import { uploadImage } from "@/app/actions/storageActions";
import type { EditorJsProps } from "@/components/admin/editor-js-types";
import { cn } from "@/lib/utils";
import { parseEditorValue } from "@/lib/utils/editorjs";
import type EditorJS from "@editorjs/editorjs";
import { useEffect, useId, useRef } from "react";

export function EditorJs({
  value,
  onChange,
  placeholder,
  className,
  imageFolder = "posts",
}: EditorJsProps) {
  const holderId = `editorjs-${useId().replace(/:/g, "")}`;
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);

  onChangeRef.current = onChange;
  initialValueRef.current = value;

  useEffect(() => {
    let isMounted = true;
    let editor: EditorJS | undefined;

    const init = async () => {
      const [
        { default: EditorJSConstructor },
        { default: Header },
        { default: List },
        { default: ImageTool },
        { default: Embed },
        { default: Quote },
      ] = await Promise.all([
        import("@editorjs/editorjs"),
        import("@editorjs/header"),
        import("@editorjs/list"),
        import("@editorjs/image"),
        import("@editorjs/embed"),
        import("@editorjs/quote"),
      ]);

      if (!isMounted) return;

      editor = new EditorJSConstructor({
        holder: holderId,
        placeholder: placeholder || "Viết nội dung...",
        tools: {
          header: {
            class: Header,
            config: { levels: [2, 3, 4], defaultLevel: 2 },
          },
          list: { class: List, inlineToolbar: true },
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const formData = new FormData();
                  formData.append("file", file);
                  formData.append("folder", imageFolder);
                  const result = await uploadImage(formData);
                  if (!result.success) {
                    return { success: 0 };
                  }
                  return { success: 1, file: { url: result.url } };
                },
              },
            },
          },
          embed: {
            class: Embed,
            config: { services: { youtube: true, vimeo: true } },
          },
          quote: { class: Quote, inlineToolbar: true },
        },
        data: parseEditorValue(initialValueRef.current),
        onChange: async () => {
          if (!editorRef.current) return;
          const content = await editorRef.current.save();
          onChangeRef.current(JSON.stringify(content));
        },
      });

      await editor.isReady;

      if (isMounted) {
        editorRef.current = editor;
      } else {
        await editor.destroy();
      }
    };

    void init();

    return () => {
      isMounted = false;
      const instance = editorRef.current ?? editor;
      if (instance) {
        void instance.destroy();
      }
      editorRef.current = null;
    };
  }, [holderId, placeholder, imageFolder]);

  return (
    <div
      id={holderId}
      className={cn(
        "min-h-[200px] rounded-md border border-input bg-background px-3 py-2 [&_.ce-block__content]:max-w-none",
        className
      )}
    />
  );
}

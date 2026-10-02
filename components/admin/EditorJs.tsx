"use client";

import { uploadImage } from "@/app/actions/storageActions";
import type { EditorJsProps } from "@/components/admin/editor-js-types";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/utils/compressImage";
import { parseEditorValue } from "@/lib/utils/editorjs";
import type EditorJS from "@editorjs/editorjs";
import { useEffect, useId, useRef } from "react";

function destroyEditor(instance: EditorJS | null | undefined) {
  if (!instance || typeof instance.destroy !== "function") return;
  try {
    instance.destroy();
  } catch (error) {
    console.warn("Editor destroy warning:", error);
  }
}

export function EditorJs({
  value,
  onChange,
  placeholder,
  className,
  imageFolder = "posts",
}: EditorJsProps) {
  const holderId = `editorjs-${useId().replace(/:/g, "")}`;
  const editorRef = useRef<EditorJS | null>(null);
  const readyRef = useRef(false);
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

      const saved = parseEditorValue(initialValueRef.current);

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
                  try {
                    let fileToUpload = file;
                    try {
                      fileToUpload = await compressImage(file);
                    } catch (compressError) {
                      console.warn("Nén ảnh thất bại, upload ảnh gốc:", compressError);
                    }

                    const formData = new FormData();
                    formData.append("file", fileToUpload);
                    formData.append("folder", imageFolder);
                    const result = await uploadImage(formData);
                    if (!result.success) {
                      console.error("[EditorJs upload]", result.error);
                      return { success: 0 };
                    }
                    return { success: 1, file: { url: result.url } };
                  } catch (error) {
                    console.error("[EditorJs upload]", error);
                    return { success: 0 };
                  }
                },
                async uploadByUrl(url: string) {
                  const trimmed = url.trim();
                  if (!/^https?:\/\//i.test(trimmed)) {
                    return { success: 0 };
                  }
                  return { success: 1, file: { url: trimmed } };
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
        data: { blocks: saved.blocks },
        onChange: async () => {
          try {
            const instance = editorRef.current;
            if (!instance || typeof instance.save !== "function") return;
            const content = await instance.save();
            onChangeRef.current(JSON.stringify(content));
          } catch (error) {
            console.error("[EditorJs onChange]", error);
          }
        },
      });

      await editor.isReady;
      if (!isMounted) {
        destroyEditor(editor);
        return;
      }

      editorRef.current = editor;
      readyRef.current = true;
    };

    void init().catch((error) => {
      console.error("[EditorJs init]", error);
    });

    return () => {
      isMounted = false;
      if (readyRef.current) {
        destroyEditor(editorRef.current);
      }
      editorRef.current = null;
      readyRef.current = false;
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

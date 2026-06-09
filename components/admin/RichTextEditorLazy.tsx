"use client";

import type { RichTextEditorProps } from "@/components/admin/rich-text-editor-types";
import dynamic from "next/dynamic";

const RichTextEditorImpl = dynamic(
  () =>
    import("@/components/admin/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-md border border-input bg-muted/50" />
    ),
  }
);

export function RichTextEditorLazy(props: RichTextEditorProps) {
  return <RichTextEditorImpl {...props} />;
}

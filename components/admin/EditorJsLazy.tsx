"use client";

import type { EditorJsProps } from "@/components/admin/editor-js-types";
import dynamic from "next/dynamic";

const EditorJsImpl = dynamic(
  () => import("@/components/admin/EditorJs").then((mod) => mod.EditorJs),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-input bg-muted/30 text-sm text-muted-foreground">
        Đang tải trình soạn thảo...
      </div>
    ),
  }
);

export function EditorJsLazy(props: EditorJsProps) {
  return <EditorJsImpl {...props} />;
}

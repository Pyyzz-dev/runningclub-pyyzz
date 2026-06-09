import type { StorageSubFolder } from "@/lib/supabase/storage-config";

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  imageFolder?: StorageSubFolder;
}

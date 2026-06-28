import type { StorageSubFolder } from "@/lib/supabase/storage-config";

export interface EditorJsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  imageFolder?: StorageSubFolder;
}

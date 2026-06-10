"use client";

import { uploadImage } from "@/app/actions/storageActions";
import { Button } from "@/components/ui/button";
import type { StorageUploadFolder } from "@/lib/supabase/storage-config";
import { cn } from "@/lib/utils";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  folder?: StorageUploadFolder;
  label?: string;
  className?: string;
  showPreview?: boolean;
}

export function ImageUploader({
  onImageUploaded,
  currentImage = "",
  folder = "introduce",
  label = "Tải ảnh lên",
  className,
  showPreview = true,
}: ImageUploaderProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const result = await uploadImage(formData);
    setUploading(false);

    if (!result.success) {
      toast.error(`Upload ảnh thất bại: ${result.error}`);
      return;
    }

    setPreview(result.url);
    onImageUploaded(result.url);
    toast.success("Upload ảnh thành công");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setPreview("");
    onImageUploaded("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(inputId)?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Đang upload..." : label}
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
        {preview && (
          <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
            <X className="mr-2 h-4 w-4" />
            Xóa ảnh
          </Button>
        )}
      </div>

      {showPreview && preview && (
        <div className="relative h-40 w-40 overflow-hidden rounded-lg border">
          <Image src={preview} alt="Preview" fill className="object-cover" />
        </div>
      )}
    </div>
  );
}

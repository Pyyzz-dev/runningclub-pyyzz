"use client";

import { removeAvatar, uploadOwnAvatar } from "@/app/actions/userActions";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/utils/compressImage";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

interface AvatarUploaderProps {
  userId: string;
  currentAvatar: string | null;
  fullName: string;
}

export function AvatarUploader({ currentAvatar, fullName }: AvatarUploaderProps) {
  const inputId = useId();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar ?? "");
  const [uploading, setUploading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    setAvatarUrl(currentAvatar ?? "");
  }, [currentAvatar]);

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 10MB");
      return;
    }

    setUploading(true);
    try {
      let fileToUpload = file;
      try {
        fileToUpload = await compressImage(file, "avatar");
      } catch (compressError) {
        console.warn("Nén avatar thất bại, dùng ảnh gốc:", compressError);
      }

      const formData = new FormData();
      formData.append("file", fileToUpload);
      const result = await uploadOwnAvatar(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(result.url ?? "");
      toast.success(result.message);
      await refreshUser();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload avatar thất bại";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    const result = await removeAvatar();
    setUploading(false);
    setConfirmRemove(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setAvatarUrl("");
    toast.success(result.message);
    await refreshUser();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32">
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="text-4xl">{initials || "?"}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {avatarUrl ? "Đổi avatar" : "Tải avatar lên"}
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => setConfirmRemove(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      <p className="max-w-xs text-center text-xs text-muted-foreground">
        Chấp nhận file JPG, PNG, WebP. Kích thước tối đa 10MB. Ảnh sẽ tự động được nén và
        cắt vuông 400×400.
      </p>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa avatar?</AlertDialogTitle>
            <AlertDialogDescription>
              Ảnh đại diện sẽ bị gỡ khỏi hồ sơ của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={uploading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={uploading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

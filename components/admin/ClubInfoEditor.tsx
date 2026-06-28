"use client";

import { updateClubInfo } from "@/app/actions/clubInfoActions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EditorJsLazy as EditorJs } from "@/components/admin/EditorJsLazy";
import { isEmptyEditorContent, renderEditorContent } from "@/lib/utils/editorjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClubInfo } from "@/lib/supabase/types";
import { Loader2, Save } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ClubInfoEditorProps {
  initialData: ClubInfo | null;
}

export function ClubInfoEditor({ initialData }: ClubInfoEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverUrl, setCoverUrl] = useState(initialData?.cover_image_url ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isEmptyEditorContent(content)) {
      toast.error("Nội dung không được để trống");
      return;
    }

    setSaving(true);

    const formData = new FormData();
    formData.append("content", content);
    if (coverUrl) {
      formData.append("coverImageUrl", coverUrl);
    }

    const result = await updateClubInfo(formData);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã lưu giới thiệu CLB");
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Chỉnh sửa</h2>

        <div className="space-y-2">
          <Label htmlFor="cover-url">Ảnh bìa</Label>
          <Input
            id="cover-url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
          />
          <ImageUploader
            folder="introduce"
            currentImage={coverUrl}
            onImageUploaded={setCoverUrl}
            label="Tải ảnh bìa lên"
          />
        </div>

        <div className="space-y-2">
          <Label>Nội dung</Label>
          <EditorJs
            key={initialData?.id ?? "club-info"}
            value={content}
            onChange={setContent}
            placeholder="Nhập nội dung giới thiệu..."
            imageFolder="introduce"
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu thay đổi
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Xem trước</h2>
        {coverUrl && (
          <div className="relative mb-4 aspect-video overflow-hidden rounded-md">
            <Image src={coverUrl} alt="Cover" fill className="object-cover" />
          </div>
        )}
        <div
          className="prose max-w-none [&_img]:max-w-full [&_img]:rounded-md"
          dangerouslySetInnerHTML={{
            __html:
              renderEditorContent(content) ||
              "<p class='text-muted-foreground'>Nội dung xem trước...</p>",
          }}
        />
      </div>
    </div>
  );
}

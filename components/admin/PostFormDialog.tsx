"use client";

import { createPost, updatePost } from "@/app/actions/postActions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditorLazy as RichTextEditor } from "@/components/admin/RichTextEditorLazy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostWithAuthorEmail } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: PostWithAuthorEmail | null;
  onSuccess?: () => void;
}

function isEmptyHtml(html: string) {
  const text = html.replace(/<[^>]*>/g, "").trim();
  return !text || html === "<p></p>";
}

export function PostFormDialog({
  open,
  onOpenChange,
  post,
  onSuccess,
}: PostFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(post?.title ?? "");
      setContent(post?.content ?? "");
      setStatus(post?.status ?? "draft");
      setCoverImageUrl(post?.cover_image_url ?? "");
    }
  }, [open, post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    if (isEmptyHtml(content)) {
      toast.error("Nội dung không được để trống");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("content", content);
    formData.set("status", status);
    formData.set("cover_image_url", coverImageUrl);

    setSubmitting(true);
    const result = post
      ? await updatePost(post.id, formData)
      : await createPost(formData);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(post ? "Đã cập nhật bài viết" : "Đã tạo bài viết");
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? "Chỉnh sửa bài viết" : "Viết bài mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Tiêu đề</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề bài viết"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-cover">Ảnh bìa</Label>
            <Input
              id="post-cover"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
            <ImageUploader
              folder="posts"
              currentImage={coverImageUrl}
              onImageUploaded={setCoverImageUrl}
              label="Tải ảnh bìa lên"
            />
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Viết nội dung bài viết..."
              imageFolder="posts"
            />
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "draft" | "published")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="published">Xuất bản</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {post ? "Cập nhật" : "Tạo bài viết"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

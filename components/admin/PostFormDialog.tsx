"use client";

import { generateCoverImage } from "@/app/actions/aiActions";
import { createPost, updatePost } from "@/app/actions/postActions";
import {
  AIGeneratePostDialog,
  type GeneratedPostDraft,
} from "@/components/admin/AIGeneratePostDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EditorJsLazy as EditorJs } from "@/components/admin/EditorJsLazy";
import { isEmptyEditorContent } from "@/lib/utils/editorjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: PostWithAuthorEmail | null;
  onSuccess?: () => void;
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
  const [generatingImage, setGeneratingImage] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [editorNonce, setEditorNonce] = useState(0);

  useEffect(() => {
    if (open) {
      setTitle(post?.title ?? "");
      setContent(post?.content ?? "");
      setStatus(post?.status ?? "draft");
      setCoverImageUrl(post?.cover_image_url ?? "");
      setCoverError(false);
      setGeneratingImage(false);
      setEditorNonce(0);
      setAiDialogOpen(false);
    }
  }, [open, post]);

  const handleAIGenerated = (data: GeneratedPostDraft) => {
    setTitle(data.title);
    setContent(data.content);
    setCoverImageUrl(data.coverImageUrl);
    setEditorNonce((n) => n + 1);
  };

  const handleRegenerateCover = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài viết trước");
      return;
    }

    setGeneratingImage(true);
    setCoverError(false);

    try {
      const seed = Date.now() + Math.floor(Math.random() * 1_000_000);
      const newImageUrl = await generateCoverImage(title, content, seed, coverImageUrl);

      if (!newImageUrl || newImageUrl === coverImageUrl) {
        toast.error("Không thể tạo ảnh khác. Vui lòng thử lại.");
        return;
      }

      setCoverImageUrl(newImageUrl);
      toast.success("Đã tạo ảnh bìa mới!");
    } catch (error) {
      console.error("Generate image error:", error);
      toast.error("Không thể tạo ảnh bìa. Vui lòng thử lại.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }
    if (isEmptyEditorContent(content)) {
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
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && aiDialogOpen) return;
          onOpenChange(nextOpen);
        }}
      >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? "Chỉnh sửa bài viết" : "Viết bài mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin bài viết hoặc tạo tự động từ link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiDialogOpen(true)}
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo từ link bằng AI
            </Button>
          </div>

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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="post-cover">Ảnh bìa</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleRegenerateCover()}
                disabled={generatingImage || submitting || !title.trim()}
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Thay đổi ảnh bìa bằng AI
                  </>
                )}
              </Button>
            </div>
            <Input
              id="post-cover"
              value={coverImageUrl}
              onChange={(e) => {
                setCoverError(false);
                setCoverImageUrl(e.target.value);
              }}
              placeholder="https://..."
              disabled={generatingImage}
            />
            {coverImageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                {coverError ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Không thể tải ảnh
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={coverImageUrl}
                    src={coverImageUrl}
                    alt="Xem trước ảnh bìa"
                    className="h-full w-full object-cover"
                    onError={() => setCoverError(true)}
                  />
                )}
              </div>
            ) : null}
            <ImageUploader
              folder="posts"
              currentImage={coverImageUrl}
              onImageUploaded={setCoverImageUrl}
              label="Tải ảnh bìa lên"
              showPreview={false}
            />
            <p className="text-xs text-muted-foreground">
              Bấm &quot;Thay đổi ảnh bìa bằng AI&quot; để tạo ảnh mới theo tiêu đề.
              Ảnh mới sẽ khác ảnh đang hiển thị. Nhớ lưu bài viết để cập nhật.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <EditorJs
              key={`${open}-${post?.id ?? "new"}-${editorNonce}`}
              value={content}
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
            <Button type="submit" disabled={submitting || generatingImage}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {post ? "Cập nhật" : "Tạo bài viết"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <AIGeneratePostDialog
      open={aiDialogOpen}
      onOpenChange={setAiDialogOpen}
      onGenerated={handleAIGenerated}
    />
    </>
  );
}

"use client";

import {
  generateCoverImage,
  generatePostFromUrl,
} from "@/app/actions/aiActions";
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
import { cn } from "@/lib/utils";
import { ImageIcon, Link as LinkIcon, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface GeneratedPostDraft {
  title: string;
  content: string;
  coverImageUrl: string;
  authorId: string;
}

interface AIGeneratePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: GeneratedPostDraft) => void;
}

interface PostPreview {
  title: string;
  content: string;
  coverImageUrl: string;
  authorId: string;
}

export function AIGeneratePostDialog({
  open,
  onOpenChange,
  onGenerated,
}: AIGeneratePostDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [preview, setPreview] = useState<PostPreview | null>(null);

  const reset = () => {
    setUrl("");
    setPreview(null);
    setImageError(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng nhập URL");
      return;
    }

    setLoading(true);
    setImageError(false);
    const result = await generatePostFromUrl(url);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setPreview({
      title: result.title,
      content: result.content,
      coverImageUrl: result.coverImageUrl,
      authorId: result.authorId,
    });
    toast.success("Đã tạo bài viết và ảnh bìa!");
  };

  const handleRegenerateImage = async () => {
    if (!preview) return;

    setLoading(true);
    setImageError(false);
    try {
      const seed = Date.now() + Math.floor(Math.random() * 1_000_000);
      const coverImageUrl = await generateCoverImage(
        preview.title,
        preview.content,
        seed,
        preview.coverImageUrl
      );
      setPreview({ ...preview, coverImageUrl });
      toast.success("Đã tạo ảnh bìa mới!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không tạo được ảnh bìa";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!preview || !preview.title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    onGenerated({
      title: preview.title.trim(),
      content: preview.content,
      coverImageUrl: preview.coverImageUrl,
      authorId: preview.authorId,
    });
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "z-[60] max-h-[90vh] overflow-y-auto",
          preview ? "sm:max-w-4xl" : "sm:max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Tạo bài viết từ link
          </DialogTitle>
          <DialogDescription>
            Paste link bài báo hoặc bài viết, AI sẽ tổng hợp nội dung và tạo ảnh bìa.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-post-url">Link bài viết</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ai-post-url"
                  type="url"
                  placeholder="https://example.com/bai-viet..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleGenerate();
                    }
                  }}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Hỗ trợ: báo điện tử, blog, trang tin tức,...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Ảnh bìa</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleRegenerateImage()}
                  disabled={loading}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                  Tạo ảnh khác
                </Button>
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                {imageError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-10 w-10" aria-hidden />
                    <p className="text-sm">Không thể tải ảnh</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRegenerateImage()}
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Thử ảnh khác
                    </Button>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={preview.coverImageUrl}
                    src={preview.coverImageUrl}
                    alt={preview.title}
                    className="h-full w-full object-cover"
                    onError={() => {
                      console.warn("Image failed to load:", preview.coverImageUrl);
                      setImageError(true);
                    }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-post-title">Tiêu đề</Label>
              <Input
                id="ai-post-title"
                value={preview.title}
                onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Nội dung</Label>
              <div
                className="prose prose-sm max-h-64 max-w-none overflow-y-auto rounded-lg border bg-muted/40 p-4"
                dangerouslySetInnerHTML={{ __html: preview.content }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          {!preview ? (
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading || !url.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Tạo bài viết
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleConfirm} disabled={loading}>
              Xác nhận & dùng cho bài viết
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

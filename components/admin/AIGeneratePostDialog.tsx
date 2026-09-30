"use client";

import { generatePostFromUrl } from "@/app/actions/aiActions";
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
import { Link as LinkIcon, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface GeneratedPostDraft {
  title: string;
  content: string;
  authorId: string;
}

interface AIGeneratePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: GeneratedPostDraft) => void;
}

export function AIGeneratePostDialog({
  open,
  onOpenChange,
  onGenerated,
}: AIGeneratePostDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    onOpenChange(nextOpen);
    if (!nextOpen) setUrl("");
  };

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast.error("Vui lòng nhập URL");
      return;
    }

    setLoading(true);
    const result = await generatePostFromUrl(url);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã tạo bài viết từ link!");
    onGenerated({
      title: result.title,
      content: result.content,
      authorId: result.authorId,
    });
    onOpenChange(false);
    setUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[60] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Tạo bài viết từ link
          </DialogTitle>
          <DialogDescription>
            Paste link bài báo hoặc bài viết, AI sẽ tự động tổng hợp thành bài
            viết Cộng đồng.
          </DialogDescription>
        </DialogHeader>

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

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

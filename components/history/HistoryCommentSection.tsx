"use client";

import {
  addHistoryComment,
  deleteHistoryComment,
} from "@/app/actions/historyCommentActions";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { HydrationSafeDateTime } from "@/components/common/HydrationSafeDateTime";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryCommentWithAuthor } from "@/lib/supabase/types";
import { ImageIcon, Loader2, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HistoryCommentSectionProps {
  historyId: string;
  comments: HistoryCommentWithAuthor[];
  isAdmin: boolean;
  currentUserId: string | null;
}

export function HistoryCommentSection({
  historyId,
  comments: initialComments,
  isAdmin,
  currentUserId,
}: HistoryCommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const isLoggedIn = Boolean(user || currentUserId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }
    if (!content.trim() && !imageUrl) {
      toast.error("Vui lòng nhập nội dung hoặc chèn ảnh");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("history_id", historyId);
    formData.set("content", content.trim());
    formData.set("image_url", imageUrl);
    formData.set("is_anonymous", String(isAnonymous));

    const result = await addHistoryComment(formData);
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setContent("");
    setImageUrl("");
    setIsAnonymous(false);
    setShowUploader(false);
    router.refresh();
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    const result = await deleteHistoryComment(pendingDeleteId, historyId);
    setDeleting(false);
    setPendingDeleteId(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setComments((prev) => prev.filter((comment) => comment.id !== pendingDeleteId));
    router.refresh();
  };

  return (
    <section className="space-y-6">
      <h2 className="font-display text-xl font-semibold">
        Bình luận ({comments.length})
      </h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
          <Textarea
            placeholder="Viết bình luận của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />

          {showUploader && (
            <ImageUploader
              folder="history-comments"
              currentImage={imageUrl}
              onImageUploaded={setImageUrl}
              label="Tải ảnh bình luận"
            />
          )}
          {!showUploader && imageUrl && (
            <p className="text-sm text-muted-foreground">Đã chọn 1 ảnh đính kèm.</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploader((open) => !open)}
              >
                <ImageIcon className="mr-1 h-4 w-4" />
                Chèn ảnh
              </Button>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="history-comment-anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label
                  htmlFor="history-comment-anonymous"
                  className="cursor-pointer font-normal"
                >
                  Bình luận ẩn danh
                </Label>
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Gửi bình luận
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg bg-muted/50 py-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>{" "}
          để bình luận
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        ) : (
          comments.map((comment) => {
            const initials = comment.is_anonymous
              ? "?"
              : comment.display_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
            const canDelete = isAdmin || comment.user_id === currentUserId;

            return (
              <div key={comment.id} className="flex gap-3 rounded-lg border bg-card p-3">
                <Avatar className="h-10 w-10 shrink-0">
                  {!comment.is_anonymous && (
                    <AvatarImage src={comment.author.avatar_url ?? undefined} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{comment.display_name}</span>
                    <HydrationSafeDateTime
                      date={comment.created_at}
                      className="text-xs text-muted-foreground"
                    />
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(comment.id)}
                        className="ml-auto text-destructive hover:text-destructive/80"
                        aria-label="Xóa bình luận"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {comment.content && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {comment.content}
                    </p>
                  )}
                  {comment.image_url && (
                    <a
                      href={comment.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative mt-2 block max-w-xs overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={comment.image_url}
                        alt="Ảnh bình luận"
                        width={320}
                        height={240}
                        className="h-auto w-full object-cover"
                      />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

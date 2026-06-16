"use client";

import {
  deleteCommentPermanently,
  hideComment,
  restoreComment,
} from "@/app/actions/commentActions";
import { CommentForm } from "@/components/forms/CommentForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HydrationSafeDateTime } from "@/components/common/HydrationSafeDateTime";
import type { CommentWithAuthor } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CommentSectionProps {
  postId: string;
  comments: CommentWithAuthor[];
  isAdmin: boolean;
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  isAdmin: boolean;
  onToggleHide: (commentId: string, isHidden: boolean) => Promise<void>;
  onDelete: (commentId: string) => void;
}

function CommentItem({ comment, isAdmin, onToggleHide, onDelete }: CommentItemProps) {
  const isHidden = comment.is_hidden;
  const commentInitials = comment.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border bg-card p-4 animate-slide-up",
        isHidden && isAdmin && "border-dashed bg-muted/30 opacity-70"
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        {!comment.is_anonymous && (
          <AvatarImage src={comment.author.avatar_url ?? undefined} />
        )}
        <AvatarFallback>{commentInitials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{comment.display_name}</span>
            <HydrationSafeDateTime
              date={comment.created_at}
              className="text-xs text-gray-400"
            />
            {isHidden && isAdmin && (
              <Badge variant="outline" className="text-xs text-gray-500">
                Đã ẩn (chỉ admin thấy)
              </Badge>
            )}
          </div>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Quản lý bình luận</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleHide(comment.id, isHidden)}>
                  {isHidden ? (
                    <Eye className="mr-2 h-4 w-4" />
                  ) : (
                    <EyeOff className="mr-2 h-4 w-4" />
                  )}
                  {isHidden ? "Hiện lại" : "Ẩn bình luận"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(comment.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa cứng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="mt-1 text-sm text-foreground">{comment.content}</p>
      </div>
    </div>
  );
}

export function CommentSection({ postId, comments, isAdmin }: CommentSectionProps) {
  const router = useRouter();
  const [localComments, setLocalComments] = useState(comments);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const visibleComments = useMemo(
    () =>
      isAdmin
        ? localComments
        : localComments.filter((comment) => !comment.is_hidden),
    [localComments, isAdmin]
  );

  const visibleCount = localComments.filter((comment) => !comment.is_hidden).length;

  const handleToggleHide = async (commentId: string, currentlyHidden: boolean) => {
    const result = currentlyHidden
      ? await restoreComment(commentId, postId)
      : await hideComment(commentId, postId);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setLocalComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, is_hidden: !currentlyHidden }
          : comment
      )
    );
    router.refresh();
  };

  const handleConfirmHardDelete = async () => {
    if (!pendingDeleteId) return;

    setDeleting(true);
    const result = await deleteCommentPermanently(pendingDeleteId, postId);
    setDeleting(false);
    setPendingDeleteId(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setLocalComments((prev) => prev.filter((comment) => comment.id !== pendingDeleteId));
    router.refresh();
  };

  return (
    <section>
      <h2 className="mb-6 font-display text-xl font-semibold">
        Bình luận ({visibleCount})
      </h2>

      <CommentForm postId={postId} className="mb-8" />

      <div className="space-y-4">
        {visibleComments.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Chưa có bình luận. Hãy là người đầu tiên!
          </p>
        ) : (
          visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAdmin={isAdmin}
              onToggleHide={handleToggleHide}
              onDelete={setPendingDeleteId}
            />
          ))
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa cứng bình luận?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bình luận sẽ bị xóa vĩnh viễn khỏi hệ
              thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmHardDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa cứng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

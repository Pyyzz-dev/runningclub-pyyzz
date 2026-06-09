"use client";

import { useState } from "react";
import { deletePost } from "@/app/actions/postActions";
import { AdminPostForm } from "@/components/forms/AdminPostForm";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PostWithAuthor } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AdminPostManagerProps {
  posts: PostWithAuthor[];
  className?: string;
}

export function AdminPostManager({ posts, className }: AdminPostManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<PostWithAuthor | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    setLoadingId(deleteId);
    const result = await deletePost(deleteId);
    setLoadingId(null);
    setDeleteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã xóa bài viết");
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo bài viết
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-xs truncate font-medium">
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author.full_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                    >
                      {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(post.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditPost(post)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(post.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo bài viết mới</DialogTitle>
          </DialogHeader>
          <AdminPostForm
            onSuccess={() => {
              setCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editPost)} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
          </DialogHeader>
          {editPost && (
            <AdminPostForm post={editPost} onSuccess={() => setEditPost(null)} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết và tất cả bình luận liên quan
              sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loadingId === deleteId ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

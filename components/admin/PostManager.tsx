"use client";

import { deletePost, restorePost } from "@/app/actions/postActions";
import { RestoreButton } from "@/components/admin/RestoreButton";
import dynamic from "next/dynamic";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PostWithAuthorEmail } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Edit, ExternalLink, Loader2, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PostFormDialog = dynamic(
  () =>
    import("@/components/admin/PostFormDialog").then((mod) => mod.PostFormDialog),
  {
    ssr: false,
    loading: () => (
      <div className="hidden" aria-hidden="true" />
    ),
  }
);

interface PostManagerProps {
  posts: PostWithAuthorEmail[];
  className?: string;
}

export function PostManager({ posts, className }: PostManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editPost, setEditPost] = useState<PostWithAuthorEmail | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        !search || post.title.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || post.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [posts, search, statusFilter]);

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
    router.refresh();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[160px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditPost(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Viết bài mới
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Tác giả</TableHead>
              <TableHead>Ngày xuất bản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => (
                <TableRow
                  key={post.id}
                  className={post.deleted_at ? "bg-muted/40 opacity-70" : undefined}
                >
                  <TableCell className="max-w-xs truncate font-medium">
                    {post.title}
                    {post.deleted_at && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Đã xóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{post.author.full_name}</p>
                      {post.author.email && (
                        <p className="text-xs text-muted-foreground">
                          {post.author.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {post.published_at
                      ? formatDateTime(post.published_at)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        post.status === "published" ? "default" : "secondary"
                      }
                    >
                      {post.status === "published" ? "Đã xuất bản" : "Bản nháp"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {post.deleted_at ? (
                        <RestoreButton
                          onRestore={() => restorePost(post.id)}
                          onSuccess={() => router.refresh()}
                        />
                      ) : (
                        <>
                          {post.status === "published" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Xem bài viết"
                            >
                              <Link href={`/community/${post.id}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditPost(post);
                              setFormOpen(true);
                            }}
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PostFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        post={editPost}
        onSuccess={() => router.refresh()}
      />

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Bài viết và tất cả bình luận
              liên quan sẽ bị xóa vĩnh viễn.
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

"use client";

import { createPost, updatePost } from "@/app/actions/postActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Post, PostStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const DRAFT_STORAGE_KEY = "admin-post-draft";

const adminPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  content: z.string().min(1, "Nội dung không được để trống"),
  status: z.enum(["draft", "published"]),
  cover_image_url: z
    .string()
    .url("URL ảnh bìa không hợp lệ")
    .optional()
    .or(z.literal("")),
});

type AdminPostFormValues = z.infer<typeof adminPostSchema>;

export interface AdminPostFormProps {
  post?: Post;
  className?: string;
  onSuccess?: () => void;
}

export function AdminPostForm({ post, className, onSuccess }: AdminPostFormProps) {
  const isEditing = Boolean(post);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDefaultValues = useCallback((): AdminPostFormValues => {
    if (post) {
      return {
        title: post.title,
        content: post.content,
        status: post.status,
        cover_image_url: post.cover_image_url ?? "",
      };
    }

    return {
      title: "",
      content: "",
      status: "draft",
      cover_image_url: "",
    };
  }, [post]);

  const loadDraftFromStorage = useCallback((): AdminPostFormValues | null => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as AdminPostFormValues;
      return {
        title: parsed.title ?? "",
        content: parsed.content ?? "",
        status: parsed.status ?? "draft",
        cover_image_url: parsed.cover_image_url ?? "",
      };
    } catch {
      return null;
    }
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminPostFormValues>({
    resolver: zodResolver(adminPostSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    reset(getDefaultValues());
  }, [post, reset, getDefaultValues]);

  useEffect(() => {
    if (isEditing || post) return;
    const draft = loadDraftFromStorage();
    if (draft) {
      reset(draft);
    }
  }, [isEditing, post, loadDraftFromStorage, reset]);

  const watchedValues = watch();

  useEffect(() => {
    if (isEditing) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedValues));
      } catch {
        // ignore storage errors
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [watchedValues, isEditing]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const onSubmit = async (values: AdminPostFormValues) => {
    const formData = new FormData();
    formData.set("title", values.title);
    formData.set("content", values.content);
    formData.set("status", values.status);
    formData.set("cover_image_url", values.cover_image_url || "");

    const result = isEditing
      ? await updatePost(post!.id, formData)
      : await createPost(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (!isEditing) {
      clearDraft();
      reset({ title: "", content: "", status: "draft", cover_image_url: "" });
    }

    toast.success(isEditing ? "Cập nhật bài viết thành công" : "Tạo bài viết thành công");
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-6", className)}
      noValidate
    >
      {!isEditing && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="h-3.5 w-3.5" />
          Bản nháp được tự động lưu
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input id="title" placeholder="Nhập tiêu đề bài viết" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        <Textarea
          id="content"
          placeholder="Nhập nội dung bài viết..."
          rows={12}
          {...register("content")}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover_image_url">URL ảnh bìa (tùy chọn)</Label>
        <Input
          id="cover_image_url"
          type="url"
          placeholder="https://..."
          {...register("cover_image_url")}
        />
        {errors.cover_image_url && (
          <p className="text-sm text-destructive">{errors.cover_image_url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Trạng thái</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as PostStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : isEditing ? (
            "Cập nhật bài viết"
          ) : (
            "Tạo bài viết"
          )}
        </Button>

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              clearDraft();
              reset({ title: "", content: "", status: "draft", cover_image_url: "" });
              toast.info("Đã xóa bản nháp");
            }}
          >
            Xóa bản nháp
          </Button>
        )}
      </div>
    </form>
  );
}

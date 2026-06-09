"use client";

import { addComment } from "@/app/actions/commentActions";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  isAnonymous: z.boolean(),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface CommentFormProps {
  postId: string;
  className?: string;
  onSuccess?: () => void;
}

export function CommentForm({ postId, className, onSuccess }: CommentFormProps) {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", isAnonymous: false },
  });

  const onSubmit = async (values: CommentFormValues) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    const formData = new FormData();
    formData.set("postId", postId);
    formData.set("content", values.content);
    formData.set("isAnonymous", String(values.isAnonymous));

    const result = await addComment(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Bình luận đã được gửi");
    reset();
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="content">Bình luận</Label>
        <Textarea
          id="content"
          placeholder="Viết bình luận của bạn..."
          rows={4}
          {...register("content")}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="isAnonymous"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="isAnonymous"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label htmlFor="isAnonymous" className="cursor-pointer font-normal">
          Bình luận ẩn danh
        </Label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang gửi...
          </>
        ) : (
          "Gửi bình luận"
        )}
      </Button>
    </form>
  );
}

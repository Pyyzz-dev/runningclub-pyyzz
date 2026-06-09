"use client";

import { addTraining } from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const adminTrainingSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().min(1, "Thời gian bắt đầu không được để trống"),
  end_time: z.string().optional(),
});

type AdminTrainingFormValues = z.infer<typeof adminTrainingSchema>;

interface AdminTrainingFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function AdminTrainingForm({ className, onSuccess }: AdminTrainingFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminTrainingFormValues>({
    resolver: zodResolver(adminTrainingSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      start_time: "",
      end_time: "",
    },
  });

  const onSubmit = async (values: AdminTrainingFormValues) => {
    const formData = new FormData();
    formData.set("title", values.title);
    if (values.description) formData.set("description", values.description);
    if (values.location) formData.set("location", values.location);
    formData.set("start_time", values.start_time);
    if (values.end_time) formData.set("end_time", values.end_time);

    const result = await addTraining(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Tạo lịch tập thành công");
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
        <Label htmlFor="title">Tiêu đề buổi tập</Label>
        <Input id="title" placeholder="Nhập tiêu đề" {...register("title")} />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả buổi tập..."
          rows={4}
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Địa điểm</Label>
        <Input id="location" placeholder="Địa điểm tập luyện" {...register("location")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start_time">Thời gian bắt đầu</Label>
          <Input id="start_time" type="datetime-local" {...register("start_time")} />
          {errors.start_time && (
            <p className="text-sm text-destructive">{errors.start_time.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_time">Thời gian kết thúc (tùy chọn)</Label>
          <Input id="end_time" type="datetime-local" {...register("end_time")} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tạo...
          </>
        ) : (
          "Tạo lịch tập"
        )}
      </Button>
    </form>
  );
}

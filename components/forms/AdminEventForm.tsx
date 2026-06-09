"use client";

import { addEvent } from "@/app/actions/adminActions";
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

const adminEventSchema = z.object({
  name: z.string().min(1, "Tên sự kiện không được để trống"),
  description: z.string().optional(),
  location: z.string().optional(),
  event_date: z.string().min(1, "Ngày sự kiện không được để trống"),
  registration_deadline: z.string().optional(),
  event_link: z.string().url("Link sự kiện không hợp lệ").optional().or(z.literal("")),
});

type AdminEventFormValues = z.infer<typeof adminEventSchema>;

interface AdminEventFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function AdminEventForm({ className, onSuccess }: AdminEventFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminEventFormValues>({
    resolver: zodResolver(adminEventSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      event_date: "",
      registration_deadline: "",
      event_link: "",
    },
  });

  const onSubmit = async (values: AdminEventFormValues) => {
    const formData = new FormData();
    formData.set("name", values.name);
    if (values.description) formData.set("description", values.description);
    if (values.location) formData.set("location", values.location);
    formData.set("event_date", values.event_date);
    if (values.registration_deadline) {
      formData.set("registration_deadline", values.registration_deadline);
    }
    if (values.event_link) formData.set("event_link", values.event_link);

    const result = await addEvent(formData);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Tạo sự kiện thành công");
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
        <Label htmlFor="name">Tên sự kiện</Label>
        <Input id="name" placeholder="Nhập tên sự kiện" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả sự kiện..."
          rows={4}
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Địa điểm</Label>
        <Input id="location" placeholder="Địa điểm tổ chức" {...register("location")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event_date">Ngày sự kiện</Label>
          <Input id="event_date" type="datetime-local" {...register("event_date")} />
          {errors.event_date && (
            <p className="text-sm text-destructive">{errors.event_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="registration_deadline">Hạn đăng ký</Label>
          <Input
            id="registration_deadline"
            type="datetime-local"
            {...register("registration_deadline")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_link">Link đăng ký (tùy chọn)</Label>
        <Input
          id="event_link"
          type="url"
          placeholder="https://..."
          {...register("event_link")}
        />
        {errors.event_link && (
          <p className="text-sm text-destructive">{errors.event_link.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tạo...
          </>
        ) : (
          "Tạo sự kiện"
        )}
      </Button>
    </form>
  );
}

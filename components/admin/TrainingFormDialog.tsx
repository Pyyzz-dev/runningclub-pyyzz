"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/format";
import type { TrainingSchedule } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TrainingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: TrainingSchedule | null;
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function TrainingFormDialog({
  open,
  onOpenChange,
  training,
  onSubmit,
}: TrainingFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(training?.title ?? "");
      setDescription(training?.description ?? "");
      setLocation(training?.location ?? "");
      setStartTime(toDatetimeLocal(training?.start_time));
      setEndTime(toDatetimeLocal(training?.end_time));
      setError(null);
    }
  }, [open, training]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    if (!location.trim()) {
      setError("Địa điểm không được để trống");
      return;
    }
    if (!startTime) {
      setError("Thời gian bắt đầu không hợp lệ");
      return;
    }
    if (!endTime) {
      setError("Thời gian kết thúc không hợp lệ");
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    const formData = new FormData();
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    formData.set("location", location.trim());
    formData.set("start_time", fromDatetimeLocal(startTime));
    formData.set("end_time", fromDatetimeLocal(endTime));

    setSubmitting(true);
    const result = await onSubmit(formData);
    setSubmitting(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {training ? "Chỉnh sửa buổi tập" : "Thêm buổi tập"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="training-title">Tiêu đề</Label>
            <Input
              id="training-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Buổi tập sáng..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-description">Mô tả</Label>
            <Textarea
              id="training-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết buổi tập (tùy chọn)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training-location">Địa điểm</Label>
            <Input
              id="training-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Công viên, sân vận động..."
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="training-start">Thời gian bắt đầu</Label>
              <Input
                id="training-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="training-end">Thời gian kết thúc</Label>
              <Input
                id="training-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {training ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

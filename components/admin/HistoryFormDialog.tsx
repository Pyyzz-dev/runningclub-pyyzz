"use client";

import { ImageUploader } from "@/components/admin/ImageUploader";
import { EditorJsLazy as EditorJs } from "@/components/admin/EditorJsLazy";
import { isEmptyEditorContent } from "@/lib/utils/editorjs";
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
import { fromDatetimeLocal, toDatetimeLocal } from "@/lib/format";
import type { ClubHistory } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HistoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ClubHistory | null;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function HistoryFormDialog({
  open,
  onOpenChange,
  entry,
  onSubmit,
}: HistoryFormDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setEventDate(toDatetimeLocal(entry?.event_date));
      setImageUrl(entry?.image_url ?? "");
      setOrderIndex(entry?.order_index ?? 0);
    }
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    if (isEmptyEditorContent(content)) {
      toast.error("Nội dung không được để trống");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("content", content);
      formData.set("event_date", fromDatetimeLocal(eventDate));
      formData.set("image_url", imageUrl);
      formData.set("order_index", String(orderIndex));
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Chỉnh sửa mốc lịch sử" : "Thêm mốc lịch sử"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="history-title">Tiêu đề</Label>
            <Input
              id="history-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề sự kiện"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Nội dung</Label>
            <EditorJs
              key={`${open}-${entry?.id ?? "new"}`}
              value={content}
              onChange={setContent}
              placeholder="Mô tả chi tiết sự kiện..."
              imageFolder="history"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history-date">Thời gian sự kiện</Label>
            <Input
              id="history-date"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Ảnh minh họa (thumbnail)</Label>
            <ImageUploader
              folder="history"
              currentImage={imageUrl}
              onImageUploaded={setImageUrl}
              label="Tải ảnh minh họa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history-order">Thứ tự hiển thị</Label>
            <Input
              id="history-order"
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
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
              {entry ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

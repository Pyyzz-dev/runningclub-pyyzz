"use client";

import { ImageUploader } from "@/components/admin/ImageUploader";
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
import type { Event } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Event | null;
  onSubmit: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSubmit,
}: EventFormDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [participantCount, setParticipantCount] = useState("0");
  const [eventLink, setEventLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(event?.name ?? "");
      setLocation(event?.location ?? "");
      setEventDate(toDatetimeLocal(event?.event_date));
      setRegistrationDeadline(toDatetimeLocal(event?.registration_deadline));
      setDescription(event?.description ?? "");
      setParticipantCount(String(event?.participant_count ?? 0));
      setEventLink(event?.event_link ?? "");
      setImageUrl(event?.image_url ?? "");
      setError(null);
    }
  }, [open, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Tên sự kiện không được để trống");
      return;
    }
    if (!location.trim()) {
      setError("Địa điểm không được để trống");
      return;
    }
    if (!eventDate) {
      setError("Ngày diễn ra không hợp lệ");
      return;
    }

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("location", location.trim());
    formData.set("event_date", fromDatetimeLocal(eventDate));
    formData.set(
      "registration_deadline",
      registrationDeadline ? fromDatetimeLocal(registrationDeadline) : ""
    );
    formData.set("description", description.trim());
    formData.set("participant_count", participantCount || "0");
    formData.set("event_link", eventLink.trim());
    formData.set("image_url", imageUrl.trim());

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
          <DialogTitle>{event ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="event-name">Tên sự kiện</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Địa điểm</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-date">Thời gian diễn ra</Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-deadline">Hạn chót đăng ký</Label>
              <Input
                id="event-deadline"
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-description">Mô tả</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-participants">Số lượng thành viên tham gia</Label>
            <Input
              id="event-participants"
              type="number"
              min={0}
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-link">Link đăng ký</Label>
            <Input
              id="event-link"
              type="url"
              value={eventLink}
              onChange={(e) => setEventLink(e.target.value)}
              placeholder="https://forms.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Ảnh đại diện sự kiện</Label>
            <ImageUploader
              folder="events"
              label="Tải ảnh sự kiện"
              currentImage={imageUrl}
              onImageUploaded={setImageUrl}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {event ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

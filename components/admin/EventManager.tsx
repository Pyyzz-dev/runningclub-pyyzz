"use client";

import {
  createEvent,
  deleteEvent,
  restoreEvent,
  updateEvent,
  updateParticipantCount,
} from "@/app/actions/eventActions";
import { EventFormDialog } from "@/components/admin/EventFormDialog";
import { RestoreButton } from "@/components/admin/RestoreButton";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { Event } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Edit, ExternalLink, ImageIcon, Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface EventManagerProps {
  events: Event[];
  className?: string;
}

export function EventManager({ events, className }: EventManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updatingCountId, setUpdatingCountId] = useState<string | null>(null);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        event.name.toLowerCase().includes(q) ||
        (event.location?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [events, search]);

  const getCount = (event: Event) =>
    localCounts[event.id] ?? event.participant_count ?? 0;

  const handleSubmit = async (formData: FormData) => {
    if (editEvent) {
      const result = await updateEvent(editEvent.id, formData);
      if (result.error) return { error: result.error };
      toast.success("Đã cập nhật sự kiện");
    } else {
      const result = await createEvent(formData);
      if (result.error) return { error: result.error };
      toast.success("Đã thêm sự kiện");
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const result = await deleteEvent(deleteId);
    setLoading(false);
    setDeleteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã xóa sự kiện");
    router.refresh();
  };

  const saveParticipantCount = async (eventId: string, count: number) => {
    setUpdatingCountId(eventId);
    const result = await updateParticipantCount(eventId, count);
    setUpdatingCountId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setLocalCounts((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    router.refresh();
  };

  const adjustCount = async (event: Event, delta: number) => {
    const next = Math.max(0, getCount(event) + delta);
    setLocalCounts((prev) => ({ ...prev, [event.id]: next }));
    await saveParticipantCount(event.id, next);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sự kiện..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditEvent(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Thêm sự kiện mới
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead>Tên sự kiện</TableHead>
              <TableHead>Địa điểm</TableHead>
              <TableHead>Ngày diễn ra</TableHead>
              <TableHead>Số lượng tham gia</TableHead>
              <TableHead>Link đăng ký</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Không có sự kiện nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((event) => (
                <TableRow
                  key={event.id}
                  className={event.deleted_at ? "bg-muted/40 opacity-70" : undefined}
                >
                  <TableCell>
                    {event.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                        <Image
                          src={event.image_url}
                          alt={event.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] font-medium">
                    {event.name}
                    {event.deleted_at && (
                      <span className="ml-2 text-xs text-muted-foreground">(Đã xóa)</span>
                    )}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(event.event_date, "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={updatingCountId === event.id}
                        onClick={() => adjustCount(event, -1)}
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 w-16 px-2 text-center"
                        value={getCount(event)}
                        disabled={updatingCountId === event.id}
                        onChange={(e) =>
                          setLocalCounts((prev) => ({
                            ...prev,
                            [event.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        onBlur={() => {
                          const count = getCount(event);
                          if (count !== event.participant_count) {
                            void saveParticipantCount(event.id, count);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={updatingCountId === event.id}
                        onClick={() => adjustCount(event, 1)}
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {updatingCountId === event.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.event_link ? (
                      <Link
                        href={event.event_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Mở link
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {event.deleted_at ? (
                        <RestoreButton
                          onRestore={() => restoreEvent(event.id)}
                          onSuccess={() => router.refresh()}
                        />
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditEvent(event);
                              setFormOpen(true);
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(event.id)}
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

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editEvent}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sự kiện?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

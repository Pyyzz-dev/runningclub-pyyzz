"use client";

import {
  addHistoryEntry,
  deleteHistoryEntry,
  reorderHistoryEntries,
  restoreHistoryEntry,
  updateHistoryEntry,
} from "@/app/actions/clubInfoActions";
import { HistoryFormDialog } from "@/components/admin/HistoryFormDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClubHistory } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface HistoryManagerProps {
  items: ClubHistory[];
  year?: string;
  className?: string;
}

function historyYear(eventDate: string): string {
  const match = /^(\d{4})/.exec(eventDate);
  if (match) return match[1];
  const parsed = new Date(eventDate).getFullYear();
  return Number.isFinite(parsed) ? String(parsed) : "";
}

function SortableHistoryItem({
  item,
  onEdit,
  onDelete,
  onRestore,
  onRestored,
}: {
  item: ClubHistory;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => Promise<{ error?: string }>;
  onRestored?: () => void;
}) {
  const isDeleted = Boolean(item.deleted_at);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: isDeleted });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-4 dark:border-slate-800 dark:bg-slate-950",
        isDragging && "opacity-50 shadow-lg",
        isDeleted && "bg-muted/40 opacity-70"
      )}
    >
      <button
        type="button"
        className={cn(
          "touch-none text-muted-foreground",
          isDeleted ? "cursor-not-allowed opacity-40" : "cursor-grab hover:text-foreground"
        )}
        {...(isDeleted ? {} : { ...attributes, ...listeners })}
        aria-label="Kéo để sắp xếp"
        disabled={isDeleted}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {item.title}
          {isDeleted && (
            <span className="ml-2 text-xs text-muted-foreground">(Đã xóa)</span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDate(item.event_date)}
        </p>
      </div>

      <div className="flex gap-1">
        {isDeleted ? (
          <RestoreButton onRestore={onRestore} onSuccess={onRestored} />
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={onEdit} title="Chỉnh sửa">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Xóa">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function HistoryManager({
  items: initialItems,
  year,
  className,
}: HistoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ClubHistory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableYears = useMemo(() => {
    const years = [
      ...new Set(items.map((item) => historyYear(item.event_date)).filter(Boolean)),
    ];
    return years.sort((a, b) => Number(b) - Number(a));
  }, [items]);

  const selectedYear =
    year && availableYears.includes(year) ? year : (availableYears[0] ?? "");

  const filteredItems = useMemo(
    () => items.filter((item) => historyYear(item.event_date) === selectedYear),
    [items, selectedYear]
  );

  const handleYearChange = (nextYear: string) => {
    const params = new URLSearchParams();
    params.set("tab", "history");
    params.set("year", nextYear);
    router.push(`/admin/club-info?${params.toString()}`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((i) => i.id === active.id);
    const newIndex = filteredItems.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedYear = arrayMove(filteredItems, oldIndex, newIndex);
    const yearIds = new Set(filteredItems.map((item) => item.id));
    const queue = [...reorderedYear];
    const merged = items.map((item) =>
      yearIds.has(item.id) ? (queue.shift() ?? item) : item
    );
    setItems(merged);

    const result = await reorderHistoryEntries(merged.map((item) => item.id));
    if (result.error) {
      toast.error(result.error);
      setItems(initialItems);
      return;
    }

    toast.success("Đã cập nhật thứ tự");
    router.refresh();
  };

  const handleSubmit = async (formData: FormData) => {
    if (editEntry) {
      const result = await updateHistoryEntry(editEntry.id, formData);
      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }
      toast.success("Đã cập nhật mốc lịch sử");
    } else {
      const result = await addHistoryEntry(formData);
      if (result.error) {
        toast.error(result.error);
        throw new Error(result.error);
      }
      toast.success("Đã thêm mốc lịch sử");
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const result = await deleteHistoryEntry(deleteId);
    setLoading(false);
    setDeleteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã xóa mốc lịch sử");
    router.refresh();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="history-year" className="text-sm font-medium">
            Chọn năm:
          </label>
          <Select
            value={selectedYear || undefined}
            onValueChange={handleYearChange}
            disabled={availableYears.length === 0}
          >
            <SelectTrigger id="history-year" className="w-[120px]">
              <SelectValue placeholder="Chọn năm" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((itemYear) => (
                <SelectItem key={itemYear} value={itemYear}>
                  {itemYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedYear ? (
            <p className="text-sm text-muted-foreground">
              Tổng: <strong>{filteredItems.length}</strong> mốc lịch sử trong năm{" "}
              {selectedYear}
            </p>
          ) : null}
        </div>
        <Button
          onClick={() => {
            setEditEntry(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Thêm mốc lịch sử
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Chưa có mốc lịch sử nào.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="rounded-lg bg-muted/40 py-12 text-center text-muted-foreground">
          Không có mốc lịch sử nào trong năm {selectedYear}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <SortableHistoryItem
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditEntry(item);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleteId(item.id)}
                  onRestore={() => restoreHistoryEntry(item.id)}
                  onRestored={() => router.refresh()}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <HistoryFormDialog
        open={formOpen}
        onOpenChange={(nextOpen) => {
          setFormOpen(nextOpen);
          if (!nextOpen) setEditEntry(null);
        }}
        entry={editEntry}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mốc lịch sử?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
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

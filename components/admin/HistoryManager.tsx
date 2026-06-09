"use client";

import {
  addHistoryEntry,
  deleteHistoryEntry,
  reorderHistoryEntries,
  updateHistoryEntry,
} from "@/app/actions/clubInfoActions";
import { HistoryFormDialog } from "@/components/admin/HistoryFormDialog";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HistoryManagerProps {
  items: ClubHistory[];
  className?: string;
}

function SortableHistoryItem({
  item,
  onEdit,
  onDelete,
}: {
  item: ClubHistory;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

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
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Kéo để sắp xếp"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(item.event_date)}
        </p>
      </div>

      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} title="Chỉnh sửa">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} title="Xóa">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export function HistoryManager({ items: initialItems, className }: HistoryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<ClubHistory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const result = await reorderHistoryEntries(reordered.map((i) => i.id));
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
      <div className="flex justify-end">
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
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {items.map((item) => (
                <SortableHistoryItem
                  key={item.id}
                  item={item}
                  onEdit={() => {
                    setEditEntry(item);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleteId(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <HistoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
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

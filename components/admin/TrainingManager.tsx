"use client";

import {
  createTraining,
  deleteTraining,
  updateTraining,
} from "@/app/actions/trainingActions";
import { TrainingFormDialog } from "@/components/admin/TrainingFormDialog";
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
import type { TrainingSchedule } from "@/lib/supabase/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface TrainingManagerProps {
  trainings: TrainingSchedule[];
  className?: string;
}

export function TrainingManager({
  trainings: initialTrainings,
  className,
}: TrainingManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTraining, setEditTraining] = useState<TrainingSchedule | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return initialTrainings.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.location?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMonth =
        !monthFilter ||
        t.start_time.startsWith(monthFilter);

      return matchesSearch && matchesMonth;
    });
  }, [initialTrainings, search, monthFilter]);

  const handleSubmit = async (formData: FormData) => {
    if (editTraining) {
      const result = await updateTraining(editTraining.id, formData);
      if (result.error) return { error: result.error };
      toast.success("Đã cập nhật buổi tập");
    } else {
      const result = await createTraining(formData);
      if (result.error) return { error: result.error };
      toast.success("Đã thêm buổi tập");
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const result = await deleteTraining(deleteId);
    setLoading(false);
    setDeleteId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã xóa buổi tập");
    router.refresh();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm buổi tập..."
              className="pl-9"
            />
          </div>
          <Input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="max-w-[180px]"
            aria-label="Lọc theo tháng"
          />
        </div>
        <Button
          onClick={() => {
            setEditTraining(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Thêm buổi tập
        </Button>
      </div>

      <div className="rounded-md border dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Địa điểm</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có buổi tập nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>{training.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(training.start_time)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(training.end_time)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTraining(training);
                          setFormOpen(true);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(training.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TrainingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        training={editTraining}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa buổi tập?</AlertDialogTitle>
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

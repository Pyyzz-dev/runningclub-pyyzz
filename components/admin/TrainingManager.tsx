"use client";

import {
  generateWeeklyTrainings,
  generateYearlyTrainings,
} from "@/app/actions/autoTrainingActions";
import {
  createTraining,
  deleteTraining,
  restoreTraining,
  updateTraining,
} from "@/app/actions/trainingActions";
import { RestoreButton } from "@/components/admin/RestoreButton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  getTrainingStatus,
  getTrainingStatusColor,
  getTrainingStatusText,
  type TrainingStatus,
} from "@/lib/utils/trainingStatus";
import { Calendar, CalendarPlus, Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  const [statusFilter, setStatusFilter] = useState<"all" | TrainingStatus>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editTraining, setEditTraining] = useState<TrainingSchedule | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [, setStatusTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStatusTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return initialTrainings.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.location?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesMonth =
        !monthFilter ||
        t.start_time.startsWith(monthFilter);

      const matchesStatus =
        statusFilter === "all" ||
        getTrainingStatus(t.start_time, t.end_time) === statusFilter;

      return matchesSearch && matchesMonth && matchesStatus;
    });
  }, [initialTrainings, search, monthFilter, statusFilter]);

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

  const handleGenerateWeekly = async () => {
    setAutoGenerating(true);
    const result = await generateWeeklyTrainings(4);
    setAutoGenerating(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  const handleGenerateYearly = async () => {
    setAutoGenerating(true);
    const result = await generateYearlyTrainings();
    setAutoGenerating(false);

    if ("error" in result && result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
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
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "all" | TrainingStatus)}
          >
            <SelectTrigger className="w-[160px]" aria-label="Lọc theo trạng thái">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
              <SelectItem value="ongoing">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Đã diễn ra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateWeekly}
            disabled={autoGenerating}
            className="gap-2"
          >
            {autoGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            Tạo 4 tuần (Thứ 4)
          </Button>
          <Button
            onClick={handleGenerateYearly}
            disabled={autoGenerating}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {autoGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
            Tạo cả năm
          </Button>
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
      </div>

      <div className="rounded-md border dark:border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Địa điểm</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  Không có buổi tập nào.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((training) => {
                const status = getTrainingStatus(training.start_time, training.end_time);

                return (
                <TableRow
                  key={training.id}
                  className={training.deleted_at ? "bg-muted/40 opacity-70" : undefined}
                >
                  <TableCell className="font-medium">
                    {training.title}
                    {training.deleted_at && (
                      <span className="ml-2 text-xs text-muted-foreground">(Đã xóa)</span>
                    )}
                  </TableCell>
                  <TableCell>{training.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(training.start_time)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(training.end_time)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                        getTrainingStatusColor(status)
                      )}
                    >
                      {getTrainingStatusText(status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {training.deleted_at ? (
                        <RestoreButton
                          onRestore={() => restoreTraining(training.id)}
                          onSuccess={() => router.refresh()}
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
              })
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

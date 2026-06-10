"use client";

import { approveMember } from "@/app/actions/adminApproveMember";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import type { PendingMember } from "@/lib/supabase/types";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PendingMembersTableProps {
  initialData: PendingMember[];
}

export function PendingMembersTable({ initialData }: PendingMembersTableProps) {
  const router = useRouter();
  const [members, setMembers] = useState(initialData);
  const [selectedMember, setSelectedMember] = useState<PendingMember | null>(null);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = (member: PendingMember) => {
    setSelectedMember(member);
    setFullName(member.full_name);
    setRemarks("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedMember || !fullName.trim()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("fullName", fullName.trim());
    formData.append("remarks", remarks);

    const result = await approveMember(selectedMember.id, formData);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
    setOpen(false);
    router.refresh();
  };

  if (members.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 py-12 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h3 className="text-lg font-medium">Không có đơn đăng ký nào</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hiện tại không có thành viên nào chờ duyệt.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ngày đăng ký</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member, index) => (
              <TableRow key={member.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(member.created_at, "dd/MM/yyyy")}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(member)}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Phê duyệt
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phê duyệt thành viên</DialogTitle>
            <DialogDescription>
              Xác nhận thông tin trước khi tạo tài khoản và gửi email kích hoạt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={selectedMember?.email ?? ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-fullName">Họ và tên *</Label>
              <Input
                id="approve-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="approve-remarks">Remarks (ghi chú nội bộ)</Label>
              <Textarea
                id="approve-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Ghi chú của admin (không hiển thị cho member)..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !fullName.trim()}>
              {loading ? "Đang xử lý..." : "Phê duyệt & Gửi email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

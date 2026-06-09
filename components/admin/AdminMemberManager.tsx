"use client";

import { useState } from "react";
import {
  createMember,
  resetMemberPassword,
  updateMemberRole,
} from "@/app/actions/adminActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { User, UserRole } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KeyRound, Loader2, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AdminMemberManagerProps {
  members: User[];
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminMemberManager({ members, className }: AdminMemberManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData(e.currentTarget);
    const result = await createMember(formData);
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã tạo thành viên mới");
    setCreateOpen(false);
    (e.target as HTMLFormElement).reset();
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setLoadingId(userId);
    const result = await updateMemberRole(userId, role);
    setLoadingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã cập nhật vai trò");
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetUserId) return;

    setLoadingId(resetUserId);
    const result = await resetMemberPassword(resetUserId, newPassword);
    setLoadingId(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Đã đặt lại mật khẩu");
    setResetUserId(null);
    setNewPassword("");
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" />
              Thêm thành viên
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo tài khoản thành viên</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Tạo tài khoản
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thành viên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Chưa có thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.id, value as UserRole)
                      }
                      disabled={loadingId === member.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Thành viên</SelectItem>
                        <SelectItem value="admin">Quản trị</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResetUserId(member.id)}
                    >
                      <KeyRound className="h-4 w-4" />
                      Đặt lại MK
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(resetUserId)}
        onOpenChange={(open) => {
          if (!open) {
            setResetUserId(null);
            setNewPassword("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>
            <Button
              type="submit"
              disabled={loadingId === resetUserId}
              className="w-full"
            >
              {loadingId === resetUserId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

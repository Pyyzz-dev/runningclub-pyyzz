"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search, User, Mail } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { User as ClubUser } from "@/lib/supabase/types";

export type MemberRow = Pick<
  ClubUser,
  "id" | "email" | "full_name" | "username" | "role" | "created_at" | "remarks" | "avatar_url"
>;

interface MembersTableProps {
  members: MemberRow[];
}

const ITEMS_PER_PAGE = 10;

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function MembersTable({ members }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredMembers = members.filter((member) => {
    const query = searchTerm.toLowerCase();
    return (
      member.full_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.username?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Hiển thị {paginatedMembers.length} / {filteredMembers.length} thành viên
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Thành viên</TableHead>
              <TableHead className="hidden md:table-cell">Username</TableHead>
              <TableHead className="hidden lg:table-cell">Email</TableHead>
              <TableHead className="hidden xl:table-cell">Ghi chú</TableHead>
              <TableHead className="hidden sm:table-cell">Ngày tham gia</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Không tìm thấy thành viên nào.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member, index) => (
                <TableRow key={member.id}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {member.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="font-mono text-sm">{member.username ?? "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="text-sm">{member.email ?? "—"}</span>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate xl:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {member.remarks ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {formatDate(member.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Thao tác</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <User className="mr-2 h-4 w-4" />
                          Xem hồ sơ
                        </DropdownMenuItem>
                        {member.email ? (
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${member.email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Gửi email
                            </a>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Mail className="mr-2 h-4 w-4" />
                            Gửi email
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          <span className="px-3 py-1 text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}

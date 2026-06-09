"use client";

import { Button } from "@/components/ui/button";
import { ShieldOff } from "lucide-react";
import Link from "next/link";

export function AdminAccessDenied() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
        <ShieldOff className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Truy cập bị từ chối
        </h1>
        <p className="max-w-md text-muted-foreground">
          Bạn không có quyền truy cập khu vực quản trị
        </p>
      </div>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}

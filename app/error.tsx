"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Đã xảy ra lỗi</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Không thể tải nội dung. Vui lòng thử lại hoặc quay về trang chủ.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Không có kết nối",
};

export default function OfflinePage() {
  return (
    <div className="container-custom flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Bạn đang ngoại tuyến</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Không thể tải trang. Vui lòng kiểm tra kết nối mạng và thử lại.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}

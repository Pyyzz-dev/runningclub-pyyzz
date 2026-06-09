"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function AccessDeniedToasterInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("access_denied") === "admin") {
      toast.error("Bạn không có quyền truy cập khu vực quản trị");
    }
  }, [searchParams]);

  return null;
}

export function AccessDeniedToaster() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedToasterInner />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { AccessDeniedToaster } from "@/components/admin/AccessDeniedToaster";

export function GlobalToasts() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedToaster />
    </Suspense>
  );
}

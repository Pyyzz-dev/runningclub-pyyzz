"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login?redirect=/admin/dashboard");
      return;
    }

    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner label="Đang xác thực quyền admin..." />
      </div>
    );
  }

  return <>{children}</>;
}

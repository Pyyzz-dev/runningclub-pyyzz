"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthGuardProps {
  children: React.ReactNode;
  message?: string;
}

const DEFAULT_MESSAGE =
  "Hãy đăng ký tài khoản và trở thành thành viên CLB để theo dõi những hoạt động này";

export function AuthGuard({ children, message = DEFAULT_MESSAGE }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const handleRestrictedClick = () => {
    toast.info(message);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner label="Đang tải..." />
      </div>
    );
  }

  if (user) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[320px]">
      <div className="pointer-events-none select-none blur-[4px] filter">{children}</div>

      <div
        className="absolute inset-0 flex cursor-pointer items-center justify-center bg-white/80 backdrop-blur-sm"
        onClick={handleRestrictedClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleRestrictedClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Nội dung dành cho thành viên đã đăng nhập"
      >
        <div
          className="max-w-md p-6 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Lock className="h-8 w-8 text-gray-500" />
          </div>
          <p className="mb-4 text-gray-700">{message}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push("/login")}>
              Đăng nhập
            </Button>
            <Button
              onClick={() => router.push("/register")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { AdminAccessDenied } from "@/components/admin/AdminAccessDenied";
import { getCurrentUser } from "@/lib/utils/db-helpers";

interface AdminGuardProps {
  children: React.ReactNode;
}

export async function AdminGuard({ children }: AdminGuardProps) {
  const { data: user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    return <AdminAccessDenied />;
  }

  return <>{children}</>;
}

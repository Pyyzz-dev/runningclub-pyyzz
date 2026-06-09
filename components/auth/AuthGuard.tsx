import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/db-helpers";

interface AuthGuardProps {
  children: React.ReactNode;
}

export async function AuthGuard({ children }: AuthGuardProps) {
  const { data: user } = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}

"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { useSearchParams } from "next/navigation";

export function LoginPageForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  return <LoginForm redirectTo={redirectTo} />;
}

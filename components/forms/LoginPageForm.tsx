"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { useSearchParams } from "next/navigation";

interface LoginPageFormProps {
  showRegisterLink?: boolean;
}

export function LoginPageForm({ showRegisterLink }: LoginPageFormProps) {
  const searchParams = useSearchParams();
  const redirectTo =
    searchParams.get("redirect") ||
    searchParams.get("redirectedFrom") ||
    "/";

  return <LoginForm redirectTo={redirectTo} showRegisterLink={showRegisterLink} />;
}

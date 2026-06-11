"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
  showRegisterLink?: boolean;
  className?: string;
}

function getLoginErrorMessage(message: string) {
  if (message === "Invalid login credentials") {
    return "Email hoặc mật khẩu không đúng";
  }
  return message;
}

export function LoginForm({
  redirectTo = "/",
  onSuccess,
  showRegisterLink = false,
  className,
}: LoginFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(getLoginErrorMessage(error.message));
      return;
    }

    await refreshUser();
    toast.success("Đăng nhập thành công!");
    onSuccess?.();
    router.push(redirectTo || "/");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="example@email.com"
            autoComplete="email"
            className="pl-9"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          autoComplete="current-password"
          leftIcon={<Lock className="h-4 w-4" />}
          disabled={isSubmitting}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </>
        )}
      </Button>

      {showRegisterLink && (
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      )}
    </form>
  );
}

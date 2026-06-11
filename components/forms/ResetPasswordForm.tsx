"use client";

import { resetPassword, verifyResetToken } from "@/app/actions/passwordResetActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const router = useRouter();

  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setValid(false);
        setError("Link không hợp lệ");
        return;
      }

      const result = await verifyResetToken(token, email);
      if (result.valid) {
        setValid(true);
      } else {
        setValid(false);
        setError(result.error || "Link không hợp lệ");
      }
    };

    verifyToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("token", token!);
    formData.append("email", email!);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    const result = await resetPassword(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(result.error || "Có lỗi xảy ra");
    }

    setLoading(false);
  };

  if (valid === null) {
    return (
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardContent className="py-8 text-center text-muted-foreground">
          Đang xác thực link...
        </CardContent>
      </Card>
    );
  }

  if (valid === false) {
    return (
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Link không hợp lệ</h2>
            <p className="text-muted-foreground">
              {error || "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/forgot-password">Yêu cầu link mới</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Đổi mật khẩu thành công!</h2>
            <p className="text-muted-foreground">Vui lòng đăng nhập với mật khẩu mới.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Đăng nhập ngay</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md animate-slide-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Đặt lại mật khẩu</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <PasswordInput
              id="newPassword"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { requestPasswordReset } from "@/app/actions/passwordResetActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("email", email);
    const result = await requestPasswordReset(formData);

    if (result.success) {
      setSent(true);
      setMessage(result.message);
    } else {
      setMessage(result.error);
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Đã gửi yêu cầu!</h2>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/login">Quay lại đăng nhập</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md animate-slide-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Quên mật khẩu</CardTitle>
        <CardDescription>
          Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu (có hiệu lực 15 phút)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

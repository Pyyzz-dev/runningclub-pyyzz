"use client";

import { registerMember } from "@/app/actions/registerAction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterMemberForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);

    const result = await registerMember(formData);

    if (result.error) {
      setError(result.error);
      setSuccess(false);
    } else {
      setSuccess(true);
      setFullName("");
      setEmail("");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Đăng ký thành công!</h2>
            <p className="text-gray-600">
              Vui lòng chờ admin <strong>phê duyệt</strong> và kiểm tra{" "}
              <strong>email cá nhân</strong> của bạn để nhận thông báo kích hoạt tài khoản.
            </p>
            <Button variant="outline" onClick={() => router.push("/")} className="mt-4">
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng ký thành viên</CardTitle>
          <CardDescription>
            Điền thông tin để đăng ký tham gia CLB Chạy bộ CMC Global
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên *</Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  id="fullName"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              {loading ? "Đang xử lý..." : "Đăng ký thành viên"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-gray-500">
        Bạn đã có tài khoản?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}

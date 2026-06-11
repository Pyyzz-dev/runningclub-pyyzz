'use server';

import { headers } from "next/headers";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function findAuthUserByEmail(email: string) {
  const adminClient = createAdminClient();
  const normalized = email.toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (found) return found;

    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}

type RequestResetResult =
  | { success: true; message: string }
  | { success: false; error: string };

type VerifyTokenResult =
  | { valid: true }
  | { valid: false; error: string };

type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function requestPasswordReset(
  formData: FormData
): Promise<RequestResetResult> {
  const rawEmail = String(formData.get("email") ?? "").trim();

  if (!rawEmail) {
    return { success: false, error: "Vui lòng nhập email" };
  }

  const email = rawEmail.toLowerCase();
  const adminClient = createAdminClient();
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  const { data: user, error: userError } = await adminClient
    .from("users")
    .select("email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (userError || !user) {
    return {
      success: true,
      message:
        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu.",
    };
  }

  const { data: existingToken } = await adminClient
    .from("password_resets")
    .select("id")
    .eq("email", email)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingToken) {
    return {
      success: true,
      message:
        "Link đặt lại mật khẩu đã được gửi, vui lòng kiểm tra email (có hiệu lực 15 phút).",
    };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const { error: insertError } = await adminClient.from("password_resets").insert({
    email,
    token,
    expires_at: expiresAt.toISOString(),
    used: false,
    created_by_ip: ip,
    user_agent: userAgent,
  });

  if (insertError) {
    console.error("Insert token error:", insertError);
    return { success: false, error: "Có lỗi xảy ra, vui lòng thử lại sau" };
  }

  const resetLink = `${getAppUrl()}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const emailSent = await sendEmail(
    email,
    "Đặt lại mật khẩu CLB Chạy bộ CMC Global",
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">Xin chào ${user.full_name}!</h2>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p>Click vào nút bên dưới để tạo mật khẩu mới:</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>🔒 Link này có hiệu lực trong <strong>15 phút</strong> và chỉ sử dụng được một lần.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Trân trọng,<br/>CLB Chạy bộ CMC Global</p>
      </div>
    `
  );

  if (!emailSent.success) {
    console.error("Email sending failed:", emailSent.error);
    return { success: false, error: "Không thể gửi email, vui lòng thử lại sau" };
  }

  return {
    success: true,
    message: "Link đặt lại mật khẩu đã được gửi đến email của bạn (có hiệu lực 15 phút).",
  };
}

export async function verifyResetToken(
  token: string,
  email: string
): Promise<VerifyTokenResult> {
  if (!token || !email) {
    return { valid: false, error: "Link không hợp lệ" };
  }

  const adminClient = createAdminClient();
  const normalizedEmail = email.toLowerCase();

  const { data: resetRequest, error } = await adminClient
    .from("password_resets")
    .select("*")
    .eq("token", token)
    .eq("email", normalizedEmail)
    .eq("used", false)
    .maybeSingle();

  if (error || !resetRequest) {
    return { valid: false, error: "Link không hợp lệ hoặc đã được sử dụng" };
  }

  if (new Date() > new Date(resetRequest.expires_at)) {
    return { valid: false, error: "Link đã hết hạn (15 phút), vui lòng yêu cầu lại" };
  }

  return { valid: true };
}

export async function resetPassword(
  formData: FormData
): Promise<ResetPasswordResult> {
  const token = String(formData.get("token") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token || !email || !newPassword) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "Mật khẩu xác nhận không khớp" };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự" };
  }

  const adminClient = createAdminClient();

  const { data: resetRequest, error: findError } = await adminClient
    .from("password_resets")
    .select("*")
    .eq("token", token)
    .eq("email", email)
    .eq("used", false)
    .maybeSingle();

  if (findError || !resetRequest) {
    return { success: false, error: "Link không hợp lệ hoặc đã được sử dụng" };
  }

  if (new Date() > new Date(resetRequest.expires_at)) {
    return { success: false, error: "Link đã hết hạn (15 phút), vui lòng yêu cầu lại" };
  }

  let authUser;
  try {
    authUser = await findAuthUserByEmail(email);
  } catch {
    return { success: false, error: "Không thể xác thực người dùng" };
  }

  if (!authUser) {
    return { success: false, error: "Không tìm thấy người dùng" };
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    authUser.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error("Update password error:", updateError);
    return { success: false, error: "Không thể cập nhật mật khẩu" };
  }

  await adminClient.from("password_resets").update({ used: true }).eq("token", token);

  await sendEmail(
    email,
    "Mật khẩu đã được thay đổi - CLB Chạy bộ CMC Global",
    `
      <p>Xin chào,</p>
      <p>Mật khẩu của bạn vừa được thay đổi thành công.</p>
      <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ admin CLB ngay lập tức.</p>
    `
  );

  return { success: true, message: "Đổi mật khẩu thành công! Vui lòng đăng nhập." };
}

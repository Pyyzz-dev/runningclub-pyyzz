"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/app/actions/adminAuthActions";
import { sendEmail } from "@/lib/email";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Database, PendingMember } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ApproveResult =
  | { success: true; message: string; error?: undefined }
  | { success?: undefined; message?: undefined; error: string };

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SPECIAL = "!@#$%";

function generateRandomPassword(length = 8): string {
  const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;
  const required = [
    UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)],
    LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)],
    NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
    SPECIAL[Math.floor(Math.random() * SPECIAL.length)],
  ];

  while (required.length < length) {
    required.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  return required.sort(() => Math.random() - 0.5).join("");
}

function slugifyUsername(fullName: string): string {
  return fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s.]/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function resolveUniqueUsername(
  adminClient: SupabaseClient<Database>,
  fullName: string,
  email: string
): Promise<string> {
  const emailPrefix = email.split("@")[0] ?? "member";
  const base = slugifyUsername(fullName) || slugifyUsername(emailPrefix) || "member";
  let suffix = 0;

  while (suffix < 100) {
    const candidate = suffix === 0 ? base : `${base}.${suffix}`;
    const { data } = await adminClient
      .from("users")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();

    if (!data) return candidate;
    suffix += 1;
  }

  return `${base}.${Date.now()}`;
}

function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return url.trim(); // chỉ cần trim khoảng trắng
}

export async function getPendingMembers(): Promise<PendingMember[]> {
  try {
    await requireAdmin();
  } catch {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pending_members")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function approveMember(
  pendingId: string,
  formData: FormData
): Promise<ApproveResult> {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không có quyền admin" };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  if (!fullName) {
    return { error: "Vui lòng nhập họ tên" };
  }

  const adminClient = createAdminClient();

  const { data: pending, error: fetchError } = await adminClient
    .from("pending_members")
    .select("*")
    .eq("id", pendingId)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError || !pending) {
    return { error: "Không tìm thấy đơn đăng ký hoặc đã được xử lý" };
  }

  const tempPassword = generateRandomPassword();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: pending.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError || !authData.user) {
    return { error: `Không thể tạo tài khoản: ${authError?.message ?? "Lỗi không xác định"}` };
  }

  const finalUsername = await resolveUniqueUsername(
    adminClient,
    fullName,
    pending.email
  );

  const { error: dbError } = await adminClient.from("users").insert({
    id: authData.user.id,
    email: pending.email,
    full_name: fullName,
    username: finalUsername,
    role: "member",
    remarks,
    avatar_url: null,
    created_at: new Date().toISOString(),
  });

  if (dbError) {
    console.error("DB error:", dbError);
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { error: "Không thể lưu thông tin thành viên" };
  }

  const { error: updateError } = await adminClient
    .from("pending_members")
    .update({
      status: "approved",
      full_name: fullName,
      remarks,
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
    })
    .eq("id", pendingId);

  if (updateError) {
    return { error: "Đã tạo tài khoản nhưng không cập nhật được trạng thái đơn đăng ký" };
  }

  const appUrl = getAppUrl();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Chào mừng ${fullName}!</h2>
      <p>Tài khoản của bạn đã được admin <strong>phê duyệt</strong>.</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0;"><strong>🔐 Thông tin đăng nhập:</strong></p>
        <p style="margin: 4px 0;">📧 <strong>Email:</strong> ${pending.email}</p>
        <p style="margin: 4px 0;">🔑 <strong>Mật khẩu tạm thời:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
      </div>
      <p>👉 <strong>Các bước tiếp theo:</strong></p>
      <ol style="margin: 8px 0 16px 20px;">
        <li>Truy cập <strong>${appUrl}/login</strong></li>
        <li>Đăng nhập bằng <strong>email</strong> và <strong>mật khẩu tạm thời</strong> trên</li>
        <li>Vào trang <strong>Hồ sơ</strong> để đổi mật khẩu ngay</li>
      </ol>
      <p>🔒 <strong>Khuyến nghị:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.</p>
      <hr style="margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">Trân trọng,<br/>CLB Chạy bộ CMC Global</p>
    </div>
  `;

  const emailResult = await sendEmail(
    pending.email,
    "Tài khoản CLB Chạy bộ CMC Global đã được kích hoạt",
    emailHtml
  );
  const emailSent = emailResult.success;

  if (!emailSent) {
    console.error("Không thể gửi email:", emailResult.error);
  }

  revalidatePath("/admin/members/pending");
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");

  return {
    success: true,
    message: `Đã phê duyệt ${fullName}. ${
      emailSent
        ? "Email kích hoạt đã được gửi."
        : "Không gửi được email — vui lòng gửi thông tin đăng nhập thủ công."
    }`,
  };
}

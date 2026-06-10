"use server";

import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterResult =
  | { success: true; message: string; error?: undefined }
  | { success?: undefined; message?: undefined; error: string };

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

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === normalized
    );
    if (found) return found;

    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}

async function sendRegistrationEmail(to: string, fullName: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0ea5e9;">Cảm ơn bạn đã quan tâm!</h2>
      <p>Xin chào <strong>${fullName}</strong>,</p>
      <p>CLB Chạy bộ CMC Global đã nhận được đơn đăng ký của bạn.</p>
      <p>Vui lòng chờ admin <strong>phê duyệt</strong> tài khoản. Bạn sẽ nhận được email thông báo khi tài khoản được kích hoạt.</p>
      <hr style="margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">Trân trọng,<br/>CLB Chạy bộ CMC Global</p>
    </div>
  `;

  const result = await sendEmail(
    to,
    "Đã nhận đơn đăng ký thành viên CLB Chạy bộ CMC Global",
    html
  );

  if (!result.success) {
    console.error("Không thể gửi email đăng ký:", result.error);
  }

  return result.success;
}

export async function registerMember(formData: FormData): Promise<RegisterResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!fullName || !email) {
    return { error: "Vui lòng nhập đầy đủ họ tên và email" };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Email không hợp lệ" };
  }

  const adminClient = createAdminClient();

  try {
    const existingAuthUser = await findAuthUserByEmail(email);
    if (existingAuthUser) {
      return { error: "Email này đã là thành viên chính thức của CLB" };
    }
  } catch {
    return { error: "Không thể kiểm tra email, vui lòng thử lại sau" };
  }

  const { data: existingPending } = await adminClient
    .from("pending_members")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existingPending?.status === "pending") {
    return { error: "Email này đã đăng ký và đang chờ admin duyệt" };
  }

  if (existingPending) {
    const { error: updateError } = await adminClient
      .from("pending_members")
      .update({
        full_name: fullName,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .eq("id", existingPending.id);

    if (updateError) {
      return { error: "Có lỗi xảy ra, vui lòng thử lại sau" };
    }
  } else {
    const { error: insertError } = await adminClient.from("pending_members").insert({
      email,
      full_name: fullName,
      status: "pending",
    });

    if (insertError) {
      return { error: "Có lỗi xảy ra, vui lòng thử lại sau" };
    }
  }

  await sendRegistrationEmail(email, fullName);

  return {
    success: true,
    message: "Đăng ký thành công! Vui lòng chờ admin phê duyệt tài khoản.",
  };
}

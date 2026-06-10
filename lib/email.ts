import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.EMAIL_FROM;
  const mailer = getTransporter();

  if (!from || !mailer) {
    return { success: false, error: new Error("SMTP chưa được cấu hình") };
  }

  try {
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email error:", error);
    return { success: false, error };
  }
}

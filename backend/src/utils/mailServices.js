import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email service not configured. Set SMTP_USER and SMTP_PASS in .env");
  }
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "School Management"}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
  console.log(`Email sent to ${to}`);
};

/**
 * Sends an email to every given user id that has an email on file. Mirrors pushService.js's
 * sendPushToUsers contract: never throws, returns {sent, failed, skipped} with skipped:true
 * when SMTP isn't configured so the caller can leave deliveryStats untouched.
 */
export async function sendEmailToUsers(userIds, { title, body }) {
  if (!userIds?.length) return { sent: 0, failed: 0, skipped: false };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[mailServices] SMTP_USER/SMTP_PASS not set — email sending is disabled");
    return { sent: 0, failed: 0, skipped: true };
  }

  const users = await User.find({ _id: { $in: userIds }, email: { $exists: true, $ne: "" } }).select("email");
  if (!users.length) return { sent: 0, failed: 0, skipped: false };

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendEmail(user.email, title || "Notification", body || "");
      sent += 1;
    } catch (error) {
      console.error(`[mailServices] Failed to send email to ${user.email}:`, error.message);
      failed += 1;
    }
  }

  return { sent, failed, skipped: false };
}

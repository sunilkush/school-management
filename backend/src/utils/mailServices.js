import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

dotenv.config();

// Explicit timeouts matter here: nodemailer's own defaults can leave a hung/unreachable SMTP
// server blocking the request for minutes. A bad or slow SMTP config should fail fast, not stall
// the whole "create notification" request that email dispatch now runs inside of.
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
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

  // Parallel, not sequential — a sequential loop means N recipients each waiting out the full
  // per-connection timeout (see transporter config above) compounds into minutes for a slow/dead
  // SMTP server, stalling the whole "create notification" request. Promise.allSettled bounds the
  // total wait to roughly one timeout period regardless of recipient count.
  const results = await Promise.allSettled(
    users.map((user) => sendEmail(user.email, title || "Notification", body || ""))
  );

  let sent = 0;
  let failed = 0;
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sent += 1;
    } else {
      console.error(`[mailServices] Failed to send email to ${users[i].email}:`, result.reason?.message);
      failed += 1;
    }
  });

  return { sent, failed, skipped: false };
}

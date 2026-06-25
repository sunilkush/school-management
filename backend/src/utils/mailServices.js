import nodemailer from "nodemailer";
import dotenv from "dotenv";

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

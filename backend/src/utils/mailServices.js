import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Configure nodemailer transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Function to send emails
export const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"School Hostel Management" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });

        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
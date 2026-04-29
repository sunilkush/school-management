import nodemailer from "nodemailer";

export const renderPayslipHtml = ({ employeeName, month, year, item }) => `
  <html><body>
    <h2>Payslip - ${month}/${year}</h2>
    <p><strong>Employee:</strong> ${employeeName}</p>
    <p><strong>Gross:</strong> ${item.gross}</p>
    <p><strong>Total Deductions:</strong> ${item.totalDeductions}</p>
    <p><strong>Net Salary:</strong> ${item.netSalary}</p>
  </body></html>
`;

export const sendPayslipEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
};

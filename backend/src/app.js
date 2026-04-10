import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import indexRouter from "./routes/index.js";
import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import booksRoutes from "./routes/book.routes.js";
import issuedBookRoutes from "./routes/issuedBooks.routes.js";
import studentRoutes from "./routes/student.routes.js";
import roleRoutes from "./routes/role.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import academicYearRoutes from "./routes/academicYear.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import reportsRoutes from "./routes/report.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import questionRoutes from "./routes/question.routes.js";
import examRoutes from "./routes/exam.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import subscriptionPlans from "./routes/subscriptionPlan.routes.js";
import feeHeadRoutes from "./routes/feeHead.routes.js";
import feeStructureRoutes from "./routes/feeStructure.routes.js";
import studentFeeRoutes from "./routes/studentFee.routes.js";
import feeInstallmentRoutes from "./routes/feeInstallment.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import feeReportRoutes from "./routes/feeReport.routes.js";
import activityLogRoutes from "./routes/activity.routes.js";
import boardRoutes from "./routes/boards.routes.js";
import chapterRoutes from "./routes/chapters.routes.js";
import boardClassRoutes from "./routes/boardsClass.routes.js";
import examReportRoutes from "./routes/exam.report.routes.js";
import schoolClassRoutes from "./routes/schoolClass.routes.js";
import transportRoutes from "./routes/transport.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";
import studentPortalRoutes from "./routes/studentPortal.routes.js";

import { ApiError } from "./utils/ApiError.js";
import { sendError } from "./utils/response.js";
import { applySecurityMiddleware, authRateLimiter } from "./middlewares/security.middleware.js";
import { enforceApiAuthByDefault } from "./middlewares/auth.middleware.js";
import { logError, requestContext } from "./middlewares/requestContext.middleware.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL || "https://school-management-nu-seven.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
};

applySecurityMiddleware(app);
app.use(requestContext);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api/v1", enforceApiAuthByDefault);
app.use("/api/v1/school", schoolRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/class", classRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/books", booksRoutes);
app.use("/api/v1/issuedBooks", issuedBookRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/role", roleRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/academicYear", academicYearRoutes);
app.use("/api/v1/sections", sectionRoutes);
app.use("/api/v1/report", reportsRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/questions", questionRoutes);
app.use("/api/v1/exams", examRoutes);
app.use("/api/v1/attempt", attemptRoutes);
app.use("/api/v1/subscription", subscriptionPlans);
app.use("/api/v1/fee-heads", feeHeadRoutes);
app.use("/api/v1/fee-structures", feeStructureRoutes);
app.use("/api/v1/student-fees", studentFeeRoutes);
app.use("/api/v1/fee-installments", feeInstallmentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/fees/report", feeReportRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/boards", boardRoutes);
app.use("/api/v1/chapters", chapterRoutes);
app.use("/api/v1/board-classes", boardClassRoutes);
app.use("/api/v1/exam-report", examReportRoutes);
app.use("/api/v1/school-class", schoolClassRoutes);
app.use("/api/v1/transport", transportRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/hostel", hostelRoutes);
app.use("/api/v1/modules", moduleRoutes);
app.use("/api/v1/payroll", payrollRoutes);
app.use("/api/v1/audit-logs", auditLogRoutes);
app.use("/api/v1/student-portal", studentPortalRoutes);
app.use((req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));

app.use((err, req, res, _next) => {
  logError(err, req);
  const statusCode = err.statusCode || 500;
  return sendError(res, {
    statusCode,
    message: err.message || "Internal Server Error",
    data:
      process.env.NODE_ENV !== "production" && err.errors?.length
        ? { errors: err.errors }
        : null,
  });
});

export { app };

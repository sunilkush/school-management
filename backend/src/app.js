import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ApiError } from "./utils/ApiError.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const rateStore = new Map();
const rateLimitLite = ({ windowMs = 15 * 60 * 1000, max = 300 } = {}) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const existing = rateStore.get(key);

  if (!existing || now > existing.expiresAt) {
    rateStore.set(key, { count: 1, expiresAt: now + windowMs });
    return next();
  }

  existing.count += 1;
  if (existing.count > max) {
    return res.status(429).json({ success: false, message: "Too many requests", data: null });
  }

  next();
};

const helmetLite = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
};

const deepSanitize = (payload) => {
  if (Array.isArray(payload)) return payload.map(deepSanitize);
  if (payload && typeof payload === "object") {
    return Object.entries(payload).reduce((acc, [k, v]) => {
      if (k.startsWith("$") || k.includes(".")) return acc;
      acc[k] = deepSanitize(v);
      return acc;
    }, {});
  }
  return payload;
};

const mongoSanitizeLite = (req, _res, next) => {
  req.body = deepSanitize(req.body || {});
  req.query = deepSanitize(req.query || {});
  req.params = deepSanitize(req.params || {});
  next();
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(helmetLite);
app.use(rateLimitLite());
app.use(mongoSanitizeLite);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

import indexRouter from "./routes/index.js";
import schoolRoutes from "./routes/school.routes.js";
import userRoutes from "./routes/user.routes.js";
import classRoutes from "./routes/class.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import subjectRoutes from "./routes/subject.routes.js";
import booksRoutes from "./routes/book.routes.js";
import issuedBookRoutes from "./routes/issuedBooks.routes.js";
import studentRoutes from "./routes/student.routes.js";
import RoleRoutes from "./routes/role.routes.js";
import EmployeeRoutes from "./routes/employee.routes.js";
import AcademicYearRoutes from "./routes/academicYear.routes.js";
import SectionRoutes from "./routes/section.routes.js";
import ReportsRoutes from "./routes/report.routes.js";
import DashboardRoutes from "./routes/dashboard.routes.js";
import QuestionRoutes from "./routes/question.routes.js";
import ExamRoutes from "./routes/exam.routes.js";
import AttemptRoutes from "./routes/attempt.routes.js";
import SubscriptionPlans from "./routes/subscriptionPlan.routes.js";
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
import authRoutes from "./routes/auth.routes.js";
import moduleRoutes from "./routes/module.routes.js";

app.use("/", indexRouter);
app.use("/api/auth", authRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/school", schoolRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/class", classRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/subject", subjectRoutes);
app.use("/api/v1/books", booksRoutes);
app.use("/api/v1/issuedBooks", issuedBookRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/role", RoleRoutes);
app.use("/api/v1/employee", EmployeeRoutes);
app.use("/api/v1/academicYear", AcademicYearRoutes);
app.use("/api/v1/sections", SectionRoutes);
app.use("/api/v1/report", ReportsRoutes);
app.use("/api/v1/dashboard", DashboardRoutes);
app.use("/api/v1/questions", QuestionRoutes);
app.use("/api/v1/exams", ExamRoutes);
app.use("/api/v1/attempt", AttemptRoutes);
app.use("/api/v1/subscription", SubscriptionPlans);
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
app.use("/api/modules", moduleRoutes);
app.use("/api/v1/modules", moduleRoutes);

app.use((req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`)));

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null,
    ...(err.errors?.length ? { errors: err.errors } : {}),
  });
});

export { app };

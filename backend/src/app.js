import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv"
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express()

app.use(
  cors({
    origin: process.env.ORIGIN_URI, // must be exact
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// file import 
import indexRouter from './routes/index.js';
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
import AttemptRoutes from "./routes/attempt.routes.js"
import ClassSectionSubjectRoutes from "./routes/classSection&subject.routes.js"
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
// route
app.use('/', indexRouter);
app.use("/api/v1/school", schoolRoutes)
app.use("/api/v1/user", userRoutes)
app.use("/api/v1/class", classRoutes)
app.use("/api/v1/attendance", attendanceRoutes)
app.use("/api/v1/subject", subjectRoutes)
app.use("/api/v1/books", booksRoutes)
app.use("/api/v1/issuedBooks", issuedBookRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/role", RoleRoutes);
app.use("/api/v1/employee", EmployeeRoutes);
app.use("/api/v1/academicYear", AcademicYearRoutes);
app.use("/api/v1/section", SectionRoutes);
app.use("/api/v1/report", ReportsRoutes);
app.use("/api/v1/dashboard", DashboardRoutes);
app.use("/api/v1/questions", QuestionRoutes);
app.use("/api/v1/exams", ExamRoutes);
app.use("/api/v1/attempt", AttemptRoutes);
app.use("/api/v1/classSection", ClassSectionSubjectRoutes)
app.use("/api/v1/subscription", SubscriptionPlans)
app.use("/api/v1/fee-heads", feeHeadRoutes);
app.use("/api/v1/fee-structures", feeStructureRoutes);
app.use("/api/v1/student-fees", studentFeeRoutes);
app.use("/api/v1/fee-installments", feeInstallmentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/fees/report", feeReportRoutes);
app.use("/api/v1/activity-logs", activityLogRoutes);
app.use("/api/v1/boards", boardRoutes);
app.use("/api/v1/chapters", chapterRoutes);
export { app }


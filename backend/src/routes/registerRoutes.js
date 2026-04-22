import indexRouter from "./index.js";
import schoolRoutes from "./school.routes.js";
import userRoutes from "./user.routes.js";
import classRoutes from "./class.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import subjectRoutes from "./subject.routes.js";
import booksRoutes from "./book.routes.js";
import issuedBookRoutes from "./issuedBooks.routes.js";
import studentRoutes from "./student.routes.js";
import roleRoutes from "./role.routes.js";
import employeeRoutes from "./employee.routes.js";
import academicYearRoutes from "./academicYear.routes.js";
import sectionRoutes from "./section.routes.js";
import reportsRoutes from "./report.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import questionRoutes from "./question.routes.js";
import examRoutes from "./exam.routes.js";
import attemptRoutes from "./attempt.routes.js";
import subscriptionPlans from "./subscriptionPlan.routes.js";
import feeHeadRoutes from "./feeHead.routes.js";
import feeStructureRoutes from "./feeStructure.routes.js";
import studentFeeRoutes from "./studentFee.routes.js";
import feeInstallmentRoutes from "./feeInstallment.routes.js";
import paymentRoutes from "./payment.routes.js";
import feeReportRoutes from "./feeReport.routes.js";
import activityLogRoutes from "./activity.routes.js";
import boardRoutes from "./boards.routes.js";
import chapterRoutes from "./chapters.routes.js";
import boardClassRoutes from "./boardsClass.routes.js";
import examReportRoutes from "./exam.report.routes.js";
import schoolClassRoutes from "./schoolClass.routes.js";
import transportRoutes from "./transport.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import hostelRoutes from "./hostel.routes.js";
import auditLogRoutes from "./auditLog.routes.js";
import moduleRoutes from "./module.routes.js";
import payrollRoutes from "./payroll.routes.js";
import studentPortalRoutes from "./studentPortal.routes.js";
import supportTicketRoutes from "./supportTicket.routes.js";
import timetableRoutes from "./timetable.routes.js";
import notificationRoutes from "./notification.routes.js";

export const apiV1Routes = [
  ["/school", schoolRoutes],
  ["/user", userRoutes],
  ["/class", classRoutes],
  ["/attendance", attendanceRoutes],
  ["/subject", subjectRoutes],
  ["/books", booksRoutes],
  ["/issuedBooks", issuedBookRoutes],
  ["/student", studentRoutes],
  ["/role", roleRoutes],
  ["/employee", employeeRoutes],
  ["/academicYear", academicYearRoutes],
  ["/sections", sectionRoutes],
  ["/report", reportsRoutes],
  ["/dashboard", dashboardRoutes],
  ["/questions", questionRoutes],
  ["/exams", examRoutes],
  ["/attempt", attemptRoutes],
  ["/subscription", subscriptionPlans],
  ["/fee-heads", feeHeadRoutes],
  ["/fee-structures", feeStructureRoutes],
  ["/student-fees", studentFeeRoutes],
  ["/fee-installments", feeInstallmentRoutes],
  ["/payments", paymentRoutes],
  ["/fees/report", feeReportRoutes],
  ["/activity-logs", activityLogRoutes],
  ["/boards", boardRoutes],
  ["/chapters", chapterRoutes],
  ["/board-classes", boardClassRoutes],
  ["/exam-report", examReportRoutes],
  ["/school-class", schoolClassRoutes],
  ["/transport", transportRoutes],
  ["/inventory", inventoryRoutes],
  ["/hostel", hostelRoutes],
  ["/modules", moduleRoutes],
  ["/payroll", payrollRoutes],
  ["/audit-logs", auditLogRoutes],
  ["/student-portal", studentPortalRoutes],
  ["/support-tickets", supportTicketRoutes],
  ["/timetables", timetableRoutes],
  ["/notifications", notificationRoutes],
];

export const registerRoutes = (app, enforceApiAuthByDefault) => {
  app.use("/", indexRouter);
  app.use("/api/v1", enforceApiAuthByDefault);

  for (const [path, routeHandler] of apiV1Routes) {
    app.use(`/api/v1${path}`, routeHandler);
  }
};

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
import certificateRoutes from "./certificate.routes.js";
import idCardRoutes from "./idCard.routes.js";
import healthRecordRoutes from "./healthRecord.routes.js";
import disciplineIncidentRoutes from "./disciplineIncident.routes.js";
import attemptRoutes from "./attempt.routes.js";
import subscriptionPlans from "./subscriptionPlan.routes.js";
import feeRoutes from "./fee.routes.js";
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
import deviceTokenRoutes from "./deviceToken.routes.js";
import messageRoutes from "./message.routes.js";
import superAdminBillingRoutes from "./superAdminBilling.routes.js";
import systemBackupRoutes from "./systemBackup.routes.js";
import backupScheduleRoutes from "./backupSchedule.routes.js";
import restoreJobRoutes from "./restoreJob.routes.js";
import schoolEventRoutes from "./schoolEvent.routes.js";
import departmentRoutes from "./department.routes.js";
import designationRoutes from "./designation.routes.js";
import globalConfigRoutes from "./globalConfig.routes.js";
import faqRoutes from "./faq.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import leaveRequestRoutes from "./leaveRequest.routes.js";
import taskRoutes from "./task.routes.js";
import admissionInquiryRoutes from "./admissionInquiry.routes.js";
import studyMaterialRoutes from "./studyMaterial.routes.js";
import lessonPlanRoutes from "./lessonPlan.routes.js";
import tempAccessRoutes from "./tempAccess.routes.js";
import librarySettingRoutes from "./librarySetting.routes.js";
import incomeRoutes from "./income.routes.js";
import expenseRoutes from "./expense.routes.js";
import advanceRoutes from "./advance.routes.js";
import bonusRoutes from "./bonus.routes.js";
import reimbursementRoutes from "./reimbursement.routes.js";
import selfAttendanceRoutes from "./selfAttendance.routes.js";
import gateEntryRoutes from "./gateEntry.routes.js";
import callLogRoutes from "./callLog.routes.js";
import vehicleMaintenanceRoutes from "./vehicleMaintenance.routes.js";
import counselingSessionRoutes from "./counselingSession.routes.js";
import emergencyAlertRoutes from "./emergencyAlert.routes.js";
import maintenanceTaskRoutes from "./maintenanceTask.routes.js";
import healthRoutes from "./health.routes.js";
import twoFactorRoutes from "./twoFactor.routes.js";
import ipRestrictionRoutes from "./ipRestriction.routes.js";
import loginLogRoutes from "./loginLog.routes.js";
import vendorRoutes from "./vendor.routes.js";
import purchaseOrderRoutes from "./purchaseOrder.routes.js";
import stockIssueRoutes from "./stockIssue.routes.js";
import amcTrackingRoutes from "./amcTracking.routes.js";
import classTeacherAssignmentRoutes from "./classTeacherAssignment.routes.js";

export const apiV1Routes = [
  ["/school", schoolRoutes],
  ["/user", userRoutes],
  ["/class", classRoutes],
  ["/attendance/self", selfAttendanceRoutes],
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
  ["/certificates", certificateRoutes],
  ["/id-cards", idCardRoutes],
  ["/health-records", healthRecordRoutes],
  ["/discipline-incidents", disciplineIncidentRoutes],
  ["/attempt", attemptRoutes],
  ["/subscription", subscriptionPlans],
  ["/fees", feeRoutes],
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
  ["/vendors", vendorRoutes],
  ["/purchase-orders", purchaseOrderRoutes],
  ["/stock-issues", stockIssueRoutes],
  ["/amc", amcTrackingRoutes],
  ["/hostel", hostelRoutes],
  ["/modules", moduleRoutes],
  ["/payroll", payrollRoutes],
  ["/audit-logs", auditLogRoutes],
  ["/student-portal", studentPortalRoutes],
  ["/support-tickets", supportTicketRoutes],
  ["/timetable", timetableRoutes],
  /* ["/timetables", timetableRoutes], */
  ["/notifications", notificationRoutes],
  ["/device-tokens", deviceTokenRoutes],
  ["/messages", messageRoutes],
  ["/super-admin/billing", superAdminBillingRoutes],
  ["/system-backups", systemBackupRoutes],
  ["/backup-schedules", backupScheduleRoutes],
  ["/restore-jobs", restoreJobRoutes],
  ["/events", schoolEventRoutes],
  ["/departments", departmentRoutes],
  ["/designations", designationRoutes],
  ["/global-config", globalConfigRoutes],
  ["/faqs", faqRoutes],
  ["/analytics", analyticsRoutes],
  ["/leave-requests", leaveRequestRoutes],
  ["/admission-inquiries", admissionInquiryRoutes],
  ["/study-materials", studyMaterialRoutes],
  ["/lesson-plans", lessonPlanRoutes],
  ["/role/temp-access", tempAccessRoutes],
  ["/library-settings", librarySettingRoutes],
  ["/income", incomeRoutes],
  ["/expenses", expenseRoutes],
  ["/advance", advanceRoutes],
  ["/bonus", bonusRoutes],
  ["/reimbursements", reimbursementRoutes],
  ["/tasks", taskRoutes],
  ["/gate-entries", gateEntryRoutes],
  ["/call-logs", callLogRoutes],
  ["/vehicle-maintenance", vehicleMaintenanceRoutes],
  ["/counseling-sessions", counselingSessionRoutes],
  ["/emergency-alerts", emergencyAlertRoutes],
  ["/maintenance-tasks", maintenanceTaskRoutes],
  ["/health", healthRoutes],
  ["/2fa", twoFactorRoutes],
  ["/ip-restrictions", ipRestrictionRoutes],
  ["/login-logs", loginLogRoutes],
  ["/class-teacher-assignments", classTeacherAssignmentRoutes],
];

export const registerRoutes = (app, enforceApiAuthByDefault) => {
  app.use("/", indexRouter);
  app.use("/api/v1", enforceApiAuthByDefault);

  for (const [path, routeHandler] of apiV1Routes) {
    app.use(`/api/v1${path}`, routeHandler);
  }
};

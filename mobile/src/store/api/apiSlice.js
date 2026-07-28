import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../../api/axiosBaseQuery';

// Income and Expense are two structurally-identical ledgers (title/category/amount/date/
// paymentMode/reference/description, list+create+delete+summary) at two different URLs — this
// generates the same 4 endpoints for both instead of hand-duplicating them, while keeping RTK
// Query's auto-generated hook names intuitive (useGetIncomeRecordsQuery, useCreateExpenseRecordMutation, ...).
function buildLedgerEndpoints(builder, { key, url, tag }) {
  return {
    [`get${key}Records`]: builder.query({
      query: (params) => ({ url, params }),
      providesTags: [tag],
    }),
    [`get${key}Summary`]: builder.query({
      query: (params) => ({ url: `${url}/summary`, params }),
      providesTags: [tag],
    }),
    [`create${key}Record`]: builder.mutation({
      query: (payload) => ({ url, method: 'post', data: payload }),
      invalidatesTags: [tag],
    }),
    [`delete${key}Record`]: builder.mutation({
      query: (id) => ({ url: `${url}/${id}`, method: 'delete' }),
      invalidatesTags: [tag],
    }),
  };
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Attendance', 'Notifications', 'Fees', 'Homework', 'Income', 'Expense', 'Book', 'TransportRoute', 'Vehicle', 'HostelRoom', 'User', 'School', 'IssuedBook', 'Message', 'LeaveRequest', 'SchoolEvent', 'TimetableEntry', 'TimeSlot', 'TimetableRoom', 'StudentProfile', 'LessonPlan', 'StudyMaterial', 'Task', 'SelfAttendance', 'Question', 'Marks', 'Inventory', 'FeeHead', 'Class', 'SupportTicket', 'TransportAssignment', 'FeeStructure', 'StudentFee', 'AdmissionInquiry', 'Role', 'Exam', 'AdmitCard', 'LibrarySetting', 'HostelVisitor', 'HostelComplaint', 'HostelAttendance', 'VehicleMaintenance', 'GateEntry', 'CallLog', 'Department', 'Designation', 'Faq', 'ActivityLog', 'Board', 'BoardClass', 'SchoolSubscription', 'SubscriptionPlan', 'SubscriptionInvoice', 'SubscriptionPayment', 'AcademicYear', 'Chapter', 'GlobalConfig', 'TempAccess', 'Report', 'SystemBackup', 'BackupSchedule', 'RestoreJob', 'BackupAuditLog', 'AuditLog', 'MaintenanceTask', 'CounselingSession', 'EmergencyAlert', 'HealthRecord', 'HealthVisit', 'Certificate', 'IDCard', 'DisciplineIncident', 'PTMSession', 'SportsTeam', 'SportsEvent', 'Achievement', 'Alumni', 'CanteenItem', 'CanteenWallet', 'CanteenOrder', 'SchoolBoard', 'PayrollSettings', 'PayrollStructure', 'PayrollCycle', 'LoanAdvance', 'BonusIncentive', 'Reimbursement', 'ExamAttempt'],
  // The `queries` branch of this reducer is persisted (see store/index.js) so a screen shows its
  // last-known-good data immediately on a cold start, even offline. refetchOnMountOrArgChange
  // means that cached data is shown instantly while a background revalidation still runs — the
  // stale-while-revalidate half of "offline support": read access to old data works with no
  // network, writes still require one (mutations aren't queued for later).
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    // Dashboard
    getDashboardSummary: builder.query({
      query: () => ({ url: '/dashboard/summary' }),
    }),
    getDashboardRoleOverview: builder.query({
      query: () => ({ url: '/dashboard/role-overview' }),
    }),
    getSchoolAdminAnalytics: builder.query({
      query: () => ({ url: '/dashboard/school-admin/analytics' }),
    }),

    // Timetable
    getMyStudentTimetable: builder.query({
      query: (academicYearId) => ({ url: '/timetable/student/my', params: { academicYearId } }),
    }),
    getMyTeacherTimetable: builder.query({
      query: (academicYearId) => ({ url: '/timetable/teacher/my', params: academicYearId ? { academicYearId } : {} }),
    }),
    // School Admin viewing an arbitrary teacher's schedule — same GET /timetable list endpoint the
    // admin's own class-timetable builder uses, just filtered by an explicit teacherId instead of
    // a class/section.
    getTeacherTimetableFor: builder.query({
      query: ({ teacherId, academicYearId }) => ({ url: '/timetable/teacher', params: { teacherId, academicYearId } }),
      providesTags: ['TimetableEntry'],
    }),
    getChildTimetable: builder.query({
      query: ({ studentId, academicYearId }) => ({
        url: `/timetable/parent/child/${studentId}`,
        params: { academicYearId },
      }),
    }),

    // Parent's children
    getMyChildren: builder.query({
      query: () => ({ url: '/student/my-children' }),
    }),

    // Attendance
    getMyAttendance: builder.query({
      query: ({ month, year, childId } = {}) => ({
        url: '/attendance/my',
        params: { month, year, childId },
      }),
      providesTags: ['Attendance'],
    }),
    getAssignedClasses: builder.query({
      query: (academicYearId) => ({ url: '/class/assign-teacher', params: { academicYearId } }),
    }),
    getStudentsByRole: builder.query({
      query: ({ schoolId, academicYearId, schoolClassId }) => ({
        url: '/student/by-role',
        params: { schoolId, academicYearId, schoolClassId },
      }),
    }),
    markBulkAttendance: builder.mutation({
      query: (payload) => ({ url: '/attendance/mark-bulk', method: 'post', data: payload }),
      invalidatesTags: ['Attendance'],
    }),

    // Student list — infinite-scroll pagination. `serializeQueryArgs` drops `page` from the cache
    // key so every page for the same (schoolClassId) filter accumulates into one cache entry;
    // `merge` appends page 2+ onto it instead of replacing it; `forceRefetch` is what actually
    // triggers the network call for a new page (RTK Query otherwise treats an already-cached key
    // as satisfied). Changing the class filter is a genuinely new list, so it still starts fresh.
    getStudentsList: builder.query({
      query: ({ schoolClassId, sectionId, page = 1, limit = 20 } = {}) => ({
        url: '/student/all',
        params: { schoolClassId, sectionId, page, limit },
      }),
      serializeQueryArgs: ({ queryArgs }) => ({ schoolClassId: queryArgs?.schoolClassId, sectionId: queryArgs?.sectionId }),
      merge: (cache, incoming, { arg }) => {
        if ((arg?.page ?? 1) <= 1) return incoming;
        // Defensive de-dupe: an unstable backend sort (fixed separately, but this is the last line
        // of defense) could otherwise return a row already seen on a prior page, which would
        // surface as a duplicate React key once rendered.
        const seenIds = new Set(cache.students.map((s) => s._id));
        cache.students.push(...incoming.students.filter((s) => !seenIds.has(s._id)));
        cache.pagination = incoming.pagination;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.page !== previousArg?.page,
    }),

    // Push notifications
    registerDeviceToken: builder.mutation({
      query: (payload) => ({ url: '/device-tokens/register', method: 'post', data: payload }),
    }),
    unregisterDeviceToken: builder.mutation({
      query: (payload) => ({ url: '/device-tokens/unregister', method: 'post', data: payload }),
    }),

    // Student details — :id is a Student._id, NOT the StudentEnrollment._id that GET /student/all
    // rows carry as their own `_id` (see that endpoint's `studentId` field, added specifically for
    // this navigation). Role-branched server-side: Student always gets their own profile; Parent
    // must own the child; Teacher/Admin/Principal/VP are school-scoped.
    getStudentDetails: builder.query({
      query: (id) => ({ url: `/student/getStudent/${id}` }),
    }),

    // Notifications — no pagination or unread-only filter exists server-side; fetch the full
    // visible list and filter/sort client-side.
    getNotifications: builder.query({
      query: () => ({ url: '/notifications' }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'patch' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'patch' }),
      invalidatesTags: ['Notifications'],
    }),
    // Admin broadcast — same list the personal inbox reads from (createNotification's own targeting
    // decides who each notification is actually visible to), plus analytics and the create form.
    getNotificationAnalytics: builder.query({
      query: () => ({ url: '/notifications/analytics' }),
    }),
    createNotification: builder.mutation({
      query: (payload) => ({ url: '/notifications', method: 'post', data: payload }),
      invalidatesTags: ['Notifications'],
    }),

    // Settings
    changePassword: builder.mutation({
      query: (payload) => ({ url: '/user/change-password', method: 'put', data: payload }),
    }),

    // Student's own extended profile (gender/DOB/blood group/address/guardian info) — separate
    // from the auth user record, which only carries name/email/phone/role/school.
    getStudentProfile: builder.query({
      query: () => ({ url: '/student-portal/me/profile' }),
      providesTags: ['StudentProfile'],
    }),
    updateStudentProfile: builder.mutation({
      query: (payload) => ({ url: '/student-portal/me/profile', method: 'put', data: payload }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Fees — Student's own Student._id/academicYearId aren't in the login/me payload at all, so
    // this resolves them first (Student role only; Parent already has both from /student/my-children).
    getMyEnrollment: builder.query({
      query: () => ({ url: '/student/my/enrollment-id' }),
    }),
    getMyFeesSummary: builder.query({
      query: ({ studentId, academicYearId }) => ({ url: '/student-fees/my', params: { studentId, academicYearId } }),
      providesTags: ['Fees'],
    }),
    getFeeInstallments: builder.query({
      query: ({ studentId, academicYearId }) => ({ url: '/fee-installments', params: { studentId, academicYearId } }),
      providesTags: ['Fees'],
    }),

    // Student's own currently-borrowed library books (Issued/Overdue only), with server-computed
    // fineAmount — deliberately NOT the admin-wide getIssuedBooks (Student isn't allowed to call
    // it) nor the other /issued-books/student route (a less complete legacy path the web app
    // itself doesn't use for this page).
    getMyLibraryBooks: builder.query({
      query: () => ({ url: '/student-portal/me/library-books' }),
      providesTags: ['IssuedBook'],
    }),

    // Student's own transport assignment — Student has no access to the admin-wide
    // /transport/assignments endpoint, so this is its own student-portal route.
    getMyTransport: builder.query({
      query: () => ({ url: '/student-portal/me/transport' }),
      providesTags: ['TransportAssignment'],
    }),

    // Student's own hostel allocation (distinct from the Hostel Warden's admin dashboard, which
    // Student/Parent aren't allowed to call).
    getMyHostel: builder.query({
      query: () => ({ url: '/student-portal/me/hostel' }),
      providesTags: ['HostelRoom'],
    }),

    // Parent — child-scoped equivalents of the Student-self endpoints above. All take the child's
    // User._id (child.userId from useGetMyChildrenQuery), NOT the Student._id, and are
    // server-verified against the parent-child link regardless of what the client passes.
    getChildLibraryBooks: builder.query({
      query: (childUserId) => ({ url: `/student-portal/child/${childUserId}/library` }),
      providesTags: ['IssuedBook'],
    }),
    getChildTransport: builder.query({
      query: (childUserId) => ({ url: `/student-portal/child/${childUserId}/transport` }),
      providesTags: ['TransportAssignment'],
    }),
    getChildHostel: builder.query({
      query: (childUserId) => ({ url: `/student-portal/child/${childUserId}/hostel` }),
      providesTags: ['HostelRoom'],
    }),
    getChildHomework: builder.query({
      query: (childUserId) => ({ url: `/student-portal/child/${childUserId}/homework` }),
      providesTags: ['Homework'],
    }),
    generateFeeInstallments: builder.mutation({
      query: (payload) => ({ url: '/fee-installments/generate', method: 'post', data: payload }),
      invalidatesTags: ['Fees'],
    }),
    payInstallment: builder.mutation({
      query: (payload) => ({ url: '/payments', method: 'post', data: payload }),
      invalidatesTags: ['Fees'],
    }),

    // Fee Collection (Accountant) — search/list students school-wide, then pay against one of
    // their StudentFee records (the simpler ledger the web app's own Collect Fees page actually
    // uses, not the FeeInstallment/Razorpay system).
    getStudentsBySchool: builder.query({
      query: (params) => ({ url: '/student/school', params }),
    }),
    payStudentFee: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/student-fees/pay/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Fees'],
    }),

    // Fee Reports (Accountant) — status-wise collected/due totals, plus the payments ledger + its
    // own summary; all 3 combined client-side, same as the web app's FeeReports.jsx does.
    getStudentFeeSummary: builder.query({
      query: () => ({ url: '/student-fees/summary' }),
      providesTags: ['Fees'],
    }),
    getPayments: builder.query({
      query: (params) => ({ url: '/payments', params }),
      providesTags: ['Fees'],
    }),
    getPaymentSummary: builder.query({
      query: () => ({ url: '/payments/summary' }),
      providesTags: ['Fees'],
    }),

    // Staff/Parent directories, and the Super Admin Users hub — GET /user/all returns the FULL
    // matching list in one shot (no page/limit support server-side), same as the web app's own
    // directory pages. isActive defaults to true (server default) but can be overridden to
    // "false" to surface deactivated users for reactivation.
    getAllUsers: builder.query({
      query: ({ roleName, academicYearId, schoolId, isActive = true } = {}) => ({
        url: '/user/all',
        params: { isActive, roleName, academicYearId, schoolId },
      }),
      providesTags: ['User'],
    }),
    activateUserAccount: builder.mutation({
      query: (id) => ({ url: `/user/active/${id}`, method: 'patch' }),
      invalidatesTags: ['User'],
    }),
    deactivateUserAccount: builder.mutation({
      query: (id) => ({ url: `/user/delete/${id}`, method: 'patch' }),
      invalidatesTags: ['User'],
    }),

    // Classes — schoolId is a required query param server-side (400 without it), unlike most
    // school-scoped endpoints which default it from the caller's own token.
    getClassDetails: builder.query({
      query: ({ schoolId, academicYearId }) => ({
        url: '/school-class/class-detailes',
        params: { schoolId, academicYearId },
      }),
    }),

    // Classes + sections with each section's CURRENT class teacher (unlike class-detailes above,
    // which only carries subject-teacher assignments) — used by the Class Teacher Assignments
    // picker so the admin can see who's already assigned before reassigning.
    getSchoolClasses: builder.query({
      query: ({ schoolId, academicYearId }) => ({
        url: '/school-class',
        params: { schoolId, academicYearId },
      }),
      providesTags: ['Class'],
    }),

    // Subjects — Subject.find({}) has no schoolId scoping at all server-side (some subjects are
    // global, some school-specific per `isGlobal`); default page size is 10, so a high limit is
    // requested to get the full catalog in one shot rather than building pagination for what's
    // typically a short, fairly static list.
    getSubjects: builder.query({
      query: () => ({ url: '/subject/all', params: { limit: 200 } }),
    }),

    // Reports — a single overview report GET, shared verbatim by School Admin/Principal/Vice
    // Principal on the web app (no per-role variant). schoolId/academicYearId are path params.
    getSchoolReport: builder.query({
      query: ({ schoolId, academicYearId }) => ({ url: `/report/school/${schoolId}/academic-year/${academicYearId}` }),
    }),

    // Report Builder (Super Admin) — a generic "save a titled JSON/text blob with school/session/
    // type metadata" CRUD, NOT a real computation/analytics engine — confirmed nothing runs
    // server-side, `data` is stored verbatim exactly as the client sends it. Distinct from the
    // school-overview report above (a different, real, computed report).
    // System Backup (Super Admin only) — manual backup creation is synchronous (runs and
    // completes within the request, no queue/worker), so no polling needed, just refetch after
    // create resolves. Download is skipped (streams an authenticated file — same reasoning as
    // every other deferred download/receipt in this app; no new native file-handling dependency).
    getBackupSummary: builder.query({
      query: () => ({ url: '/system-backups/summary' }),
    }),
    getSystemBackups: builder.query({
      query: (params) => ({ url: '/system-backups', params }),
      providesTags: ['SystemBackup'],
    }),
    createManualBackup: builder.mutation({
      query: (payload) => ({ url: '/system-backups/manual', method: 'post', data: payload }),
      invalidatesTags: ['SystemBackup'],
    }),
    deleteSystemBackup: builder.mutation({
      query: (id) => ({ url: `/system-backups/${id}`, method: 'delete' }),
      invalidatesTags: ['SystemBackup'],
    }),
    getBackupAuditLogs: builder.query({
      query: (params) => ({ url: '/system-backups/audit-logs', params }),
      providesTags: ['BackupAuditLog'],
    }),

    // Backup Schedules — metadata-only CRUD; there is no real cron engine executing these
    // server-side, confirmed nothing ever writes nextRunAt/lastRunAt except the client itself.
    getBackupSchedules: builder.query({
      query: () => ({ url: '/backup-schedules' }),
      providesTags: ['BackupSchedule'],
    }),
    createBackupSchedule: builder.mutation({
      query: (payload) => ({ url: '/backup-schedules', method: 'post', data: payload }),
      invalidatesTags: ['BackupSchedule'],
    }),
    updateBackupSchedule: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/backup-schedules/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['BackupSchedule'],
    }),
    deleteBackupSchedule: builder.mutation({
      query: (id) => ({ url: `/backup-schedules/${id}`, method: 'delete' }),
      invalidatesTags: ['BackupSchedule'],
    }),

    // Restore Jobs — request → approve (a masked ≥6-char confirmation field; confirmed NOT real
    // MFA server-side, just a length check with no OTP/TOTP dispatch or comparison — mirrored
    // faithfully as-is, matching the real web app's own weak implementation, not upgraded) → run.
    // No reject/deny action exists in the backend.
    getRestoreJobs: builder.query({
      query: () => ({ url: '/restore-jobs' }),
      providesTags: ['RestoreJob'],
    }),
    requestRestoreJob: builder.mutation({
      query: (payload) => ({ url: '/restore-jobs/request', method: 'post', data: payload }),
      invalidatesTags: ['RestoreJob'],
    }),
    approveRestoreJob: builder.mutation({
      query: ({ id, mfaToken }) => ({ url: `/restore-jobs/${id}/approve`, method: 'patch', data: { mfaToken } }),
      invalidatesTags: ['RestoreJob'],
    }),
    runRestoreJob: builder.mutation({
      query: (id) => ({ url: `/restore-jobs/${id}/run`, method: 'post' }),
      invalidatesTags: ['RestoreJob', 'SystemBackup'],
    }),

    getReports: builder.query({
      query: (params) => ({ url: '/report/getReport', params }),
      providesTags: ['Report'],
    }),
    createReport: builder.mutation({
      query: (payload) => ({ url: '/report/create', method: 'post', data: payload }),
      invalidatesTags: ['Report'],
    }),
    deleteReport: builder.mutation({
      query: (id) => ({ url: `/report/delete/${id}`, method: 'delete' }),
      invalidatesTags: ['Report'],
    }),

    // Platform-wide analytics (Super Admin) — schoolId omitted means platform-wide; passed means
    // a single-school drill-down. Distinct from Principal's own 'AcademicReports' (ExamAttempt
    // per-student report) — a real naming collision on the web app itself between two completely
    // different components sharing the same display name.
    getAcademicSummary: builder.query({
      query: (schoolId) => ({ url: '/analytics/academic', params: { schoolId } }),
    }),
    getFinanceSummary: builder.query({
      query: ({ schoolId, year } = {}) => ({ url: '/analytics/finance', params: { schoolId, year } }),
    }),

    // Homework/Assignments — file attachments are deferred (needs expo-document-picker, a new
    // native dependency); submission works with remarks text only, which the backend accepts
    // (multer's attachments field has no minCount, so a text-only submit is a real, complete
    // "Submitted" status, not a stub).
    getMyHomework: builder.query({
      query: () => ({ url: '/student-portal/me/homework' }),
      providesTags: ['Homework'],
    }),
    submitHomework: builder.mutation({
      query: ({ assignmentId, remarks }) => ({ url: `/student-portal/me/homework/${assignmentId}/submit`, method: 'post', data: { remarks } }),
      invalidatesTags: ['Homework'],
    }),
    getTeacherHomework: builder.query({
      query: (academicYearId) => ({ url: '/student-portal/teacher/homework', params: { academicYearId } }),
      providesTags: ['Homework'],
    }),
    createTeacherHomework: builder.mutation({
      query: (payload) => ({ url: '/student-portal/teacher/homework', method: 'post', data: payload }),
      invalidatesTags: ['Homework'],
    }),
    getHomeworkSubmissions: builder.query({
      query: (assignmentId) => ({ url: `/student-portal/teacher/homework/${assignmentId}/submissions` }),
      providesTags: ['Homework'],
    }),
    gradeSubmission: builder.mutation({
      query: ({ submissionId, grade, feedback }) => ({
        url: `/student-portal/teacher/homework/submissions/${submissionId}/grade`,
        method: 'put',
        data: { grade, feedback },
      }),
      invalidatesTags: ['Homework'],
    }),

    // Lesson Plans — teacherId is auto-scoped server-side for the Teacher role (see
    // lessonPlan.controllers.js), so no teacherId param is ever sent from here.
    getLessonPlans: builder.query({
      query: (params) => ({ url: '/lesson-plans', params }),
      providesTags: ['LessonPlan'],
    }),
    createLessonPlan: builder.mutation({
      query: (payload) => ({ url: '/lesson-plans', method: 'post', data: payload }),
      invalidatesTags: ['LessonPlan'],
    }),

    // Study Materials — `externalLink` is a plain URL field, an alternative to uploading a file
    // (createStudyMaterial only calls Cloudinary if `req.file` is present) — no document-picker
    // dependency needed for the mobile create flow.
    getStudyMaterials: builder.query({
      query: (params) => ({ url: '/study-materials', params }),
      providesTags: ['StudyMaterial'],
    }),
    createStudyMaterial: builder.mutation({
      query: (payload) => ({ url: '/study-materials', method: 'post', data: payload }),
      invalidatesTags: ['StudyMaterial'],
    }),

    // Tasks — listTasks auto-scopes to `assignedTo: currentUser` for every role except School
    // Admin, so this always returns "my tasks" here. Non-admins can only PATCH their own
    // assigneeStatus via `myStatus` (updateTask's non-admin branch), not any other task field.
    getMyTasks: builder.query({
      query: (params) => ({ url: '/tasks', params }),
      providesTags: ['Task'],
    }),
    updateMyTaskStatus: builder.mutation({
      query: ({ id, myStatus }) => ({ url: `/tasks/${id}`, method: 'patch', data: { myStatus } }),
      invalidatesTags: ['Task'],
    }),
    // School Admin task management — listTasks (above, reused) already returns every task in the
    // school for this role (no assignedTo scoping), so only create/update/delete/assignable-users
    // are new here.
    getAssignableUsers: builder.query({
      query: () => ({ url: '/tasks/assignable-users' }),
    }),
    createTask: builder.mutation({
      query: (payload) => ({ url: '/tasks', method: 'post', data: payload }),
      invalidatesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/tasks/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['Task'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({ url: `/tasks/${id}`, method: 'delete' }),
      invalidatesTags: ['Task'],
    }),

    // Self-attendance (GPS check-in/out) — checkIn/checkOut both require { lat, lng }; the backend
    // computes distance-from-school and rejects outside the geofence radius (403) itself.
    getSelfAttendanceStatus: builder.query({
      query: () => ({ url: '/attendance/self/status' }),
      providesTags: ['SelfAttendance'],
    }),
    checkInSelfAttendance: builder.mutation({
      query: (payload) => ({ url: '/attendance/self/check-in', method: 'post', data: payload }),
      invalidatesTags: ['SelfAttendance'],
    }),
    checkOutSelfAttendance: builder.mutation({
      query: (payload) => ({ url: '/attendance/self/check-out', method: 'post', data: payload }),
      invalidatesTags: ['SelfAttendance'],
    }),
    getSelfAttendanceHistory: builder.query({
      query: (params) => ({ url: '/attendance/self/history', params }),
      providesTags: ['SelfAttendance'],
    }),

    // Question Bank — read-only browse (create needs a full MCQ options/correct-answers editor,
    // a separate, larger feature not built here).
    getQuestions: builder.query({
      query: (params) => ({ url: '/questions/getQuestions', params }),
      providesTags: ['Question'],
    }),

    // Evaluation (marks entry) — enterMarksBulk upserts one Marks doc per {examId, studentId,
    // subjectId}; totalMarks/passingMarks come from the exam itself, so only obtainedMarks is
    // actually collected per student here.
    enterExamMarksBulk: builder.mutation({
      query: (payload) => ({ url: '/exams/marks/bulk', method: 'post', data: payload }),
      invalidatesTags: ['Marks'],
    }),

    // Exam Reports — performance summary over ExamAttempt records (the online exam-attempt
    // track), not the offline Marks-entry track above; an exam with no online attempts taken
    // returns 404, surfaced here as an empty state rather than an error.
    getExamPerformanceSummary: builder.query({
      query: (examId) => ({ url: `/exam-report/exam/${examId}/summary` }),
      providesTags: ['Marks'],
    }),

    // Academic Reports (Principal/VP) — per-attempt row list (student/exam/score/status), a
    // different presentation from the single-exam aggregate above; both read the same ExamAttempt
    // data.
    getExamReports: builder.query({
      query: (params) => ({ url: '/exam-report', params }),
      providesTags: ['Marks'],
    }),

    // Student Monthly Report — per-student attendance % for a class/section in a given month.
    getMonthlyAttendanceReport: builder.query({
      query: (params) => ({ url: '/attendance/report/monthly', params }),
      providesTags: ['Attendance'],
    }),

    // Geofence settings (School Admin) — same School.location doc the self-attendance check-in/out
    // flow validates against server-side.
    getGeofenceSettings: builder.query({
      query: () => ({ url: '/attendance/self/geofence' }),
      providesTags: ['SelfAttendance'],
    }),
    updateGeofenceSettings: builder.mutation({
      query: (payload) => ({ url: '/attendance/self/geofence', method: 'put', data: payload }),
      invalidatesTags: ['SelfAttendance'],
    }),

    // Inventory (supplies/assets)
    getInventoryItems: builder.query({
      query: (params) => ({ url: '/inventory', params }),
      providesTags: ['Inventory'],
    }),
    createInventoryItem: builder.mutation({
      query: (payload) => ({ url: '/inventory', method: 'post', data: payload }),
      invalidatesTags: ['Inventory'],
    }),

    // Fee Categories (Fee Heads) — `name` is a fixed enum server-side, not free text.
    getFeeHeadsBySchool: builder.query({
      query: (params) => ({ url: '/fee-heads/by-school', params }),
      providesTags: ['FeeHead'],
    }),
    createFeeHead: builder.mutation({
      query: (payload) => ({ url: '/fee-heads', method: 'post', data: payload }),
      invalidatesTags: ['FeeHead'],
    }),

    // Fee Structures — links a Fee Head to a class + academic year with an amount/frequency; 409
    // if one already exists for that exact combo.
    getFeeStructures: builder.query({
      query: (params) => ({ url: '/fee-structures', params }),
      providesTags: ['FeeStructure'],
    }),
    createFeeStructure: builder.mutation({
      query: (payload) => ({ url: '/fee-structures', method: 'post', data: payload }),
      invalidatesTags: ['FeeStructure'],
    }),
    deleteFeeStructure: builder.mutation({
      query: (id) => ({ url: `/fee-structures/${id}`, method: 'delete' }),
      invalidatesTags: ['FeeStructure'],
    }),

    // Assign Fees — bulk (studentIds) or single (studentId) assignment of a fee structure; server
    // silently skips students who already have it rather than erroring, unless ALL are duplicates.
    assignFeesToStudents: builder.mutation({
      query: (payload) => ({ url: '/student-fees/assign', method: 'post', data: payload }),
      invalidatesTags: ['StudentFee', 'Fees'],
    }),

    // Admin-wide attendance records (any role/class/section/date) — the same endpoint backs
    // several nav destinations (Dashboard/Table/Student/Teacher/Staff Attendance), which all
    // resolve to one filterable screen rather than 5 near-identical ones.
    getAttendanceRecords: builder.query({
      query: (params) => ({ url: '/attendance', params }),
      providesTags: ['Attendance'],
    }),

    // Assign a class teacher to a section.
    assignClassTeacher: builder.mutation({
      query: (payload) => ({ url: '/sections/assign-teacher', method: 'post', data: payload }),
      invalidatesTags: ['Class'],
    }),

    // Finance — Income and Expense ledgers (Accountant/School Admin write; Principal/VP read-only,
    // no matching mobile nav item so irrelevant here).
    ...buildLedgerEndpoints(builder, { key: 'Income', url: '/income', tag: 'Income' }),
    ...buildLedgerEndpoints(builder, { key: 'Expense', url: '/expenses', tag: 'Expense' }),

    // Books — GET /book has no schoolId scoping if the caller has no schoolId (never true for a
    // signed-in staff member here), category is free text server-side (no enum), so filter chips
    // are built from whatever categories are actually in use rather than a hardcoded list.
    getBooks: builder.query({
      query: () => ({ url: '/book' }),
      providesTags: ['Book'],
    }),
    createBook: builder.mutation({
      query: (payload) => ({ url: '/book', method: 'post', data: payload }),
      invalidatesTags: ['Book'],
    }),
    updateBook: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/book/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Book'],
    }),
    deleteBook: builder.mutation({
      query: (id) => ({ url: `/book/${id}`, method: 'delete' }),
      invalidatesTags: ['Book'],
    }),

    // Fine Management — a separate feature from IssuedBooksScreen's return flow (which only
    // auto-computes and displays a fine; it never calls a collection endpoint).
    getFineSummary: builder.query({
      query: () => ({ url: '/issued-books/fines' }),
      providesTags: ['IssuedBook'],
    }),
    collectFine: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/issued-books/${id}/fine`, method: 'patch', data: payload }),
      invalidatesTags: ['IssuedBook'],
    }),

    // Library Settings — one config doc per school (loan limits, fine rates, etc.); GET
    // auto-creates a default doc if none exists yet.
    getLibrarySettings: builder.query({
      query: () => ({ url: '/library-settings' }),
      providesTags: ['LibrarySetting'],
    }),
    updateLibrarySettings: builder.mutation({
      query: (payload) => ({ url: '/library-settings', method: 'put', data: payload }),
      invalidatesTags: ['LibrarySetting'],
    }),

    // Transport — Routes and Vehicles.
    getTransportRoutes: builder.query({
      query: () => ({ url: '/transport/routes' }),
      providesTags: ['TransportRoute'],
    }),
    createTransportRoute: builder.mutation({
      query: (payload) => ({ url: '/transport/routes', method: 'post', data: payload }),
      invalidatesTags: ['TransportRoute'],
    }),
    deleteTransportRoute: builder.mutation({
      query: (id) => ({ url: `/transport/routes/${id}`, method: 'delete' }),
      invalidatesTags: ['TransportRoute'],
    }),
    getVehicles: builder.query({
      query: () => ({ url: '/transport/vehicles' }),
      providesTags: ['Vehicle'],
    }),
    createVehicle: builder.mutation({
      query: (payload) => ({ url: '/transport/vehicles', method: 'post', data: payload }),
      invalidatesTags: ['Vehicle'],
    }),
    deleteVehicle: builder.mutation({
      query: (id) => ({ url: `/transport/vehicles/${id}`, method: 'delete' }),
      invalidatesTags: ['Vehicle'],
    }),

    // Vehicle Maintenance (Fuel & Maintenance) — a separate mount from /transport, its own model.
    getMaintenanceRecords: builder.query({
      query: (params) => ({ url: '/vehicle-maintenance', params }),
      providesTags: ['VehicleMaintenance'],
    }),
    getMaintenanceStats: builder.query({
      query: () => ({ url: '/vehicle-maintenance/stats' }),
      providesTags: ['VehicleMaintenance'],
    }),
    createMaintenanceRecord: builder.mutation({
      query: (payload) => ({ url: '/vehicle-maintenance', method: 'post', data: payload }),
      invalidatesTags: ['VehicleMaintenance'],
    }),
    updateMaintenanceRecord: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/vehicle-maintenance/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['VehicleMaintenance'],
    }),

    // Gate Entry (Receptionist's front-desk Visitor Management) — a separate model from Hostel
    // Warden's own HostelVisitor system.
    getGateEntries: builder.query({
      query: (params) => ({ url: '/gate-entries', params }),
      providesTags: ['GateEntry'],
    }),
    getGateEntryStats: builder.query({
      query: () => ({ url: '/gate-entries/stats' }),
      providesTags: ['GateEntry'],
    }),
    createGateEntry: builder.mutation({
      query: (payload) => ({ url: '/gate-entries', method: 'post', data: payload }),
      invalidatesTags: ['GateEntry'],
    }),
    markGateExit: builder.mutation({
      query: (id) => ({ url: `/gate-entries/${id}/exit`, method: 'patch' }),
      invalidatesTags: ['GateEntry'],
    }),
    deleteGateEntry: builder.mutation({
      query: (id) => ({ url: `/gate-entries/${id}`, method: 'delete' }),
      invalidatesTags: ['GateEntry'],
    }),

    // Call Log (Receptionist)
    getCallLogs: builder.query({
      query: (params) => ({ url: '/call-logs', params }),
      providesTags: ['CallLog'],
    }),
    createCallLog: builder.mutation({
      query: (payload) => ({ url: '/call-logs', method: 'post', data: payload }),
      invalidatesTags: ['CallLog'],
    }),
    deleteCallLog: builder.mutation({
      query: (id) => ({ url: `/call-logs/${id}`, method: 'delete' }),
      invalidatesTags: ['CallLog'],
    }),

    // Transport Assignments — assigns a student (by StudentEnrollment id, NOT Student/User id) to
    // a route + vehicle. POST is an upsert keyed on {schoolId, activeAcademicYearId,
    // studentEnrollmentId} — calling it again for the same student just updates route/vehicle/stops.
    getAssignableTransportStudents: builder.query({
      query: () => ({ url: '/transport/students' }),
    }),
    getTransportAssignments: builder.query({
      query: () => ({ url: '/transport/assignments' }),
      providesTags: ['TransportAssignment'],
    }),
    saveTransportAssignment: builder.mutation({
      query: (payload) => ({ url: '/transport/assignments', method: 'post', data: payload }),
      invalidatesTags: ['TransportAssignment'],
    }),
    deleteTransportAssignment: builder.mutation({
      query: (id) => ({ url: `/transport/assignments/${id}`, method: 'delete' }),
      invalidatesTags: ['TransportAssignment'],
    }),

    // Hostel rooms — `students` is an embedded subdocument array of {_id, name}, not a real
    // Student reference (assignStudentToRoom just takes a free-text studentName), so no student
    // search/picker is needed here.
    getHostelRooms: builder.query({
      query: () => ({ url: '/hostel/rooms' }),
      providesTags: ['HostelRoom'],
    }),
    createHostelRoom: builder.mutation({
      query: (payload) => ({ url: '/hostel/rooms', method: 'post', data: payload }),
      invalidatesTags: ['HostelRoom'],
    }),
    deleteHostelRoom: builder.mutation({
      query: (id) => ({ url: `/hostel/rooms/${id}`, method: 'delete' }),
      invalidatesTags: ['HostelRoom'],
    }),
    assignStudentToRoom: builder.mutation({
      query: ({ roomId, studentName, studentId }) => ({ url: `/hostel/rooms/${roomId}/assign`, method: 'post', data: { studentName, studentId } }),
      invalidatesTags: ['HostelRoom'],
    }),
    removeStudentFromRoom: builder.mutation({
      query: ({ roomId, studentId }) => ({ url: `/hostel/rooms/${roomId}/students/${studentId}`, method: 'delete' }),
      invalidatesTags: ['HostelRoom'],
    }),

    // Hostel Visitor Log — distinct from Receptionist's gate-entry visitor system (a separate
    // model entirely), this is hostel-specific.
    getHostelVisitors: builder.query({
      query: (params) => ({ url: '/hostel/visitors', params }),
      providesTags: ['HostelVisitor'],
    }),
    createVisitorEntry: builder.mutation({
      query: (payload) => ({ url: '/hostel/visitors', method: 'post', data: payload }),
      invalidatesTags: ['HostelVisitor'],
    }),
    markVisitorExit: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/hostel/visitors/${id}/exit`, method: 'put', data: payload }),
      invalidatesTags: ['HostelVisitor'],
    }),
    deleteVisitorEntry: builder.mutation({
      query: (id) => ({ url: `/hostel/visitors/${id}`, method: 'delete' }),
      invalidatesTags: ['HostelVisitor'],
    }),

    // Hostel Complaints — full status workflow (open→in_progress→resolved/closed, or rejected)
    // with a built-in actionHistory audit trail server-side.
    getHostelComplaints: builder.query({
      query: (params) => ({ url: '/hostel/complaints', params }),
      providesTags: ['HostelComplaint'],
    }),
    createHostelComplaint: builder.mutation({
      query: (payload) => ({ url: '/hostel/complaints', method: 'post', data: payload }),
      invalidatesTags: ['HostelComplaint'],
    }),
    updateHostelComplaint: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/hostel/complaints/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['HostelComplaint'],
    }),
    deleteHostelComplaint: builder.mutation({
      query: (id) => ({ url: `/hostel/complaints/${id}`, method: 'delete' }),
      invalidatesTags: ['HostelComplaint'],
    }),

    // Hostel Attendance (resident roll-call) — distinct from the dashboard's read-only
    // "lastAttendance" summary panel; this is the actual mark/history/summary CRUD surface.
    getTodayHostelAttendanceSheet: builder.query({
      query: (params) => ({ url: '/hostel/attendance/today', params }),
      providesTags: ['HostelAttendance'],
    }),
    markHostelAttendance: builder.mutation({
      query: (payload) => ({ url: '/hostel/attendance', method: 'post', data: payload }),
      invalidatesTags: ['HostelAttendance'],
    }),
    getHostelAttendance: builder.query({
      query: (params) => ({ url: '/hostel/attendance', params }),
      providesTags: ['HostelAttendance'],
    }),
    getHostelAttendanceSummary: builder.query({
      query: (params) => ({ url: '/hostel/attendance/summary', params }),
      providesTags: ['HostelAttendance'],
    }),

    // Schools (Super Admin) — registering a new school needs multipart logo upload and is a
    // separate, larger feature not built here; this covers the base directory (list, activate,
    // deactivate, delete) the same way the web page's card grid does, minus its subscription
    // management drawer.
    getAllSchools: builder.query({
      query: (params) => ({ url: '/school/getAllSchool', params: { limit: 100, ...params } }),
      providesTags: ['School'],
    }),
    activateSchoolAccount: builder.mutation({
      query: (id) => ({ url: `/school/activate/${id}`, method: 'put' }),
      invalidatesTags: ['School'],
    }),
    deactivateSchoolAccount: builder.mutation({
      query: (id) => ({ url: `/school/deactivate/${id}`, method: 'put' }),
      invalidatesTags: ['School'],
    }),
    deleteSchoolAccount: builder.mutation({
      query: (id) => ({ url: `/school/delete/${id}`, method: 'delete' }),
      invalidatesTags: ['School'],
    }),
    // No logo upload here (would need a new native image-picker dependency, same reasoning as the
    // deferred Profile photo upload) — plain JSON body, multer skips non-multipart requests so
    // the backend's upload.fields() middleware doesn't interfere.
    registerSchool: builder.mutation({
      query: (payload) => ({ url: '/school/register', method: 'post', data: payload }),
      invalidatesTags: ['School'],
    }),

    // Subscription & Billing (Super Admin) — per-school subscription lifecycle.
    getSchoolSubscription: builder.query({
      query: (schoolId) => ({ url: `/super-admin/billing/schools/${schoolId}/subscription` }),
      providesTags: ['SchoolSubscription'],
    }),
    renewSchoolSubscription: builder.mutation({
      query: (schoolId) => ({ url: `/super-admin/billing/schools/${schoolId}/renew`, method: 'post' }),
      invalidatesTags: ['SchoolSubscription'],
    }),
    cancelSchoolSubscription: builder.mutation({
      query: (schoolId) => ({ url: `/super-admin/billing/schools/${schoolId}/cancel`, method: 'post' }),
      invalidatesTags: ['SchoolSubscription'],
    }),
    suspendSchoolSubscription: builder.mutation({
      query: (schoolId) => ({ url: `/super-admin/billing/schools/${schoolId}/suspend`, method: 'post' }),
      invalidatesTags: ['SchoolSubscription'],
    }),
    reactivateSchoolSubscription: builder.mutation({
      query: (schoolId) => ({ url: `/super-admin/billing/schools/${schoolId}/reactivate`, method: 'post' }),
      invalidatesTags: ['SchoolSubscription'],
    }),
    changeSchoolPlan: builder.mutation({
      query: ({ schoolId, ...payload }) => ({ url: `/super-admin/billing/schools/${schoolId}/change-plan`, method: 'post', data: payload }),
      invalidatesTags: ['SchoolSubscription'],
    }),

    // Subscription Plans — list via the older, broadly-readable /subscription/allplan; create/
    // update/deactivate via the newer superAdminBilling "V2" endpoints, which is what the actual
    // web SubscriptionPlans page uses (confirmed against the real page, not guessed).
    getSubscriptionPlans: builder.query({
      query: () => ({ url: '/subscription/allplan' }),
      providesTags: ['SubscriptionPlan'],
    }),
    createSubscriptionPlan: builder.mutation({
      query: (payload) => ({ url: '/super-admin/billing/plans', method: 'post', data: payload }),
      invalidatesTags: ['SubscriptionPlan'],
    }),
    updateSubscriptionPlan: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/super-admin/billing/plans/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['SubscriptionPlan'],
    }),
    deactivateSubscriptionPlan: builder.mutation({
      query: (id) => ({ url: `/super-admin/billing/plans/${id}`, method: 'delete' }),
      invalidatesTags: ['SubscriptionPlan'],
    }),

    // Payment History / Revenue (Super Admin) — platform billing, distinct from the school-level
    // fee Payment model Accountant already uses.
    getAllInvoices: builder.query({
      query: () => ({ url: '/super-admin/billing/invoices' }),
      providesTags: ['SubscriptionInvoice'],
    }),
    getAllSubscriptionPayments: builder.query({
      query: () => ({ url: '/super-admin/billing/payments' }),
      providesTags: ['SubscriptionPayment'],
    }),
    getRevenueSummary: builder.query({
      query: () => ({ url: '/super-admin/billing/revenue/summary' }),
      providesTags: ['SubscriptionInvoice'],
    }),
    generateSchoolInvoice: builder.mutation({
      query: ({ schoolId, ...payload }) => ({ url: `/super-admin/billing/schools/${schoolId}/invoices`, method: 'post', data: payload }),
      invalidatesTags: ['SubscriptionInvoice'],
    }),
    addManualPayment: builder.mutation({
      query: ({ invoiceId, ...payload }) => ({ url: `/super-admin/billing/invoices/${invoiceId}/payments/manual`, method: 'post', data: payload }),
      invalidatesTags: ['SubscriptionInvoice', 'SubscriptionPayment'],
    }),

    // Issued Books — issuing to staff (issuedToUserId, memberType 'Teacher') is deferred; this
    // covers the dominant workflow, issuing to a Student. Invalidates 'Book' too since issue/
    // return changes a Book's availableCopies, which the Books screen's stat cards read.
    getIssuedBooks: builder.query({
      query: () => ({ url: '/issued-books' }),
      providesTags: ['IssuedBook'],
    }),
    issueBookToStudent: builder.mutation({
      query: (payload) => ({ url: '/issued-books/issue', method: 'post', data: payload }),
      invalidatesTags: ['IssuedBook', 'Book'],
    }),
    returnIssuedBook: builder.mutation({
      query: ({ id, status }) => ({ url: `/issued-books/return/${id}`, method: 'put', data: { status } }),
      invalidatesTags: ['IssuedBook', 'Book'],
    }),
    deleteIssuedBook: builder.mutation({
      query: (id) => ({ url: `/issued-books/${id}`, method: 'delete' }),
      invalidatesTags: ['IssuedBook'],
    }),

    // Hostel Warden dashboard — the web app treats this as that role's whole landing page
    // (route `hostelwarden` index); mobile's nav has a separate generic Dashboard tab already, so
    // this rich KPI+chart view lives under the "Hostel" tab instead. Leaves/Visitors/Complaints
    // full CRUD (5 sub-features on web) are out of scope — this is the read-only overview only.
    getHostelWardenDashboard: builder.query({
      query: () => ({ url: '/dashboard/hostel-warden/overview' }),
    }),

    // Exams — read-only list + published results. Exam creation/scheduling/paper-builder/admit-
    // cards/seat-plan (School Admin/Principal/Teacher) and marks entry + evaluation (Teacher) are
    // deferred as disproportionate for a first mobile pass. Note: ExamResult.studentId refs User,
    // not Student — unlike most of this app's other student-scoped data — verified directly
    // against the model before building.
    // Fixed a pre-existing URL bug here: exam.routes.js is mounted at '/exams' (plural,
    // registerRoutes.js), but these 3 endpoints were hitting singular '/exam' — a 404 in
    // production for every role using this screen. Verified against the actual route file before
    // fixing, not guessed.
    getExams: builder.query({
      query: ({ academicYearId, studentId, schoolClassId, status, search } = {}) => ({
        url: '/exams',
        params: { academicYearId, studentId, schoolClassId, status, search, limit: 50 },
      }),
      providesTags: ['Exam'],
    }),
    getMyExamResults: builder.query({
      query: () => ({ url: '/exams/results/student' }),
    }),
    getChildExamResults: builder.query({
      query: (studentUserId) => ({ url: `/exams/results/parent/${studentUserId}` }),
    }),

    // Online exam-taking (Student) — a genuine timed-quiz engine, mirroring web's ExamLive.jsx /
    // StudentExamsPage.jsx / AttemptReview.jsx exactly against attempt.routes.js (mounted at
    // '/attempt', registerRoutes.js). Not deferred: this is a fully working feature on web with a
    // real backend contract (attempt.controllers.js), and it's the single most core student-facing
    // action in the app, so it doesn't fit the "disproportionate for a first pass" bar the rest of
    // the deferred exam sub-features (paper-builder etc.) were held to.
    getExamAttempts: builder.query({
      query: (params) => ({ url: '/attempt', params }),
      providesTags: ['ExamAttempt'],
    }),
    getActiveExamAttempt: builder.query({
      query: (examId) => ({ url: `/attempt/active/${examId}` }),
      providesTags: ['ExamAttempt'],
    }),
    getExamAttemptById: builder.query({
      query: (id) => ({ url: `/attempt/${id}` }),
      providesTags: ['ExamAttempt'],
    }),
    startExamAttempt: builder.mutation({
      query: (examId) => ({ url: '/attempt/start', method: 'post', data: { examId } }),
      invalidatesTags: ['ExamAttempt'],
    }),
    autosaveExamAnswer: builder.mutation({
      query: ({ attemptId, questionId, answer, flagged }) => ({
        url: `/attempt/${attemptId}/answer`,
        method: 'patch',
        data: { questionId, answer, flagged },
      }),
    }),
    submitExamAttempt: builder.mutation({
      query: ({ attemptId, answers }) => ({ url: '/attempt/submit', method: 'post', data: { attemptId, answers } }),
      invalidatesTags: ['ExamAttempt', 'Exam'],
    }),

    // Messages — a real, working mailbox feature (unlike "Chat", which is dead mockup code on the
    // web app with no backend at all — not built here). One screen works for every role; the
    // server-side role gate (ALL_MESSAGE_ROLES) already covers all 11 mobile roles.
    getMessageRecipients: builder.query({
      query: () => ({ url: '/messages/recipients' }),
    }),
    getMessages: builder.query({
      query: ({ mailbox = 'inbox', search } = {}) => ({ url: '/messages', params: { mailbox, search } }),
      providesTags: ['Message'],
    }),
    getMessageThread: builder.query({
      query: (id) => ({ url: `/messages/${id}/thread` }),
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation({
      query: (payload) => ({ url: '/messages', method: 'post', data: payload }),
      invalidatesTags: ['Message'],
    }),
    markMessageRead: builder.mutation({
      query: (id) => ({ url: `/messages/${id}/read`, method: 'patch' }),
      invalidatesTags: ['Message'],
    }),
    archiveMessage: builder.mutation({
      query: (id) => ({ url: `/messages/${id}/archive`, method: 'patch' }),
      invalidatesTags: ['Message'],
    }),
    deleteMessageForMe: builder.mutation({
      query: (id) => ({ url: `/messages/${id}`, method: 'delete' }),
      invalidatesTags: ['Message'],
    }),

    // Leave Management — self-service apply/track (every employee role + Student + Parent-for-
    // child) and the School Admin approval console. Note: userId here is always a User._id — for
    // a Parent viewing/submitting for a child, that's child.userId (the same bridge field used by
    // Attendance/Exams), not the child's Student._id.
    getMyLeaveRequests: builder.query({
      query: ({ userId, status, year } = {}) => ({ url: '/leave-requests/my', params: { userId, status, year } }),
      providesTags: ['LeaveRequest'],
    }),
    createLeaveRequest: builder.mutation({
      query: (payload) => ({ url: '/leave-requests', method: 'post', data: payload }),
      invalidatesTags: ['LeaveRequest'],
    }),
    cancelLeaveRequest: builder.mutation({
      query: (id) => ({ url: `/leave-requests/${id}`, method: 'delete' }),
      invalidatesTags: ['LeaveRequest'],
    }),
    getLeaveRequestsForSchool: builder.query({
      query: ({ status } = {}) => ({ url: '/leave-requests', params: { status, limit: 50 } }),
      providesTags: ['LeaveRequest'],
    }),
    approveLeaveRequest: builder.mutation({
      query: (id) => ({ url: `/leave-requests/${id}/approve`, method: 'patch' }),
      invalidatesTags: ['LeaveRequest'],
    }),
    rejectLeaveRequest: builder.mutation({
      query: ({ id, rejectionReason }) => ({ url: `/leave-requests/${id}/reject`, method: 'patch', data: { rejectionReason } }),
      invalidatesTags: ['LeaveRequest'],
    }),

    // Payroll — read-only self-service (payslips/structure/attendance), matching the web app's
    // PayrollSelfServicePage.jsx exactly: one GET, no writes.
    getMyPayrollSummary: builder.query({
      query: () => ({ url: '/payroll/self/summary' }),
    }),

    // Payroll admin — Salary Structures (School Admin only on web, FULL_ACCESS_ROLES server-side).
    getPayrollStructures: builder.query({
      query: (params) => ({ url: '/payroll/structure', params }),
      providesTags: ['PayrollStructure'],
    }),
    createPayrollStructure: builder.mutation({
      query: (payload) => ({ url: '/payroll/structure', method: 'post', data: payload }),
      invalidatesTags: ['PayrollStructure'],
    }),

    // Payroll admin — Monthly Run (generate a cycle, then lock it, then mark it paid; each step
    // is a one-way gate server-side — a paid cycle can't be regenerated or unlocked).
    getLatestPayrollCycle: builder.query({
      query: () => ({ url: '/payroll/cycle/latest' }),
      providesTags: ['PayrollCycle'],
    }),
    getPayrollCycle: builder.query({
      query: ({ month, year }) => ({ url: `/payroll/cycle/${month}/${year}` }),
      providesTags: ['PayrollCycle'],
    }),
    generatePayrollCycle: builder.mutation({
      query: (payload) => ({ url: '/payroll/cycle/generate', method: 'post', data: payload }),
      invalidatesTags: ['PayrollCycle'],
    }),
    lockPayrollCycle: builder.mutation({
      query: (id) => ({ url: `/payroll/cycle/${id}/lock`, method: 'post' }),
      invalidatesTags: ['PayrollCycle'],
    }),
    payPayrollCycle: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/payroll/cycle/${id}/pay`, method: 'post', data: payload }),
      invalidatesTags: ['PayrollCycle'],
    }),

    // Payroll admin — Monthly Reports (aggregate totals for a given cycle).
    getMonthlyPayrollReport: builder.query({
      query: (params) => ({ url: '/payroll/reports/monthly', params }),
    }),

    // Payroll admin — Salary Advance (loan) requests.
    getAdvances: builder.query({
      query: (params) => ({ url: '/advance', params }),
      providesTags: ['LoanAdvance'],
    }),
    createAdvance: builder.mutation({
      query: (payload) => ({ url: '/advance', method: 'post', data: payload }),
      invalidatesTags: ['LoanAdvance'],
    }),
    approveAdvance: builder.mutation({
      query: (id) => ({ url: `/advance/${id}/approve`, method: 'put' }),
      invalidatesTags: ['LoanAdvance'],
    }),
    rejectAdvance: builder.mutation({
      query: ({ id, reason }) => ({ url: `/advance/${id}/reject`, method: 'put', data: { reason } }),
      invalidatesTags: ['LoanAdvance'],
    }),
    closeAdvance: builder.mutation({
      query: (id) => ({ url: `/advance/${id}/close`, method: 'put' }),
      invalidatesTags: ['LoanAdvance'],
    }),

    // Payroll admin — Bonus & Incentives.
    getBonuses: builder.query({
      query: (params) => ({ url: '/bonus', params }),
      providesTags: ['BonusIncentive'],
    }),
    createBonus: builder.mutation({
      query: (payload) => ({ url: '/bonus', method: 'post', data: payload }),
      invalidatesTags: ['BonusIncentive'],
    }),
    approveBonus: builder.mutation({
      query: (id) => ({ url: `/bonus/${id}/approve`, method: 'put' }),
      invalidatesTags: ['BonusIncentive'],
    }),
    cancelBonus: builder.mutation({
      query: (id) => ({ url: `/bonus/${id}/cancel`, method: 'put' }),
      invalidatesTags: ['BonusIncentive'],
    }),

    // Payroll admin — Reimbursements (two-stage manager-then-finance approval).
    getReimbursements: builder.query({
      query: (params) => ({ url: '/reimbursements', params }),
      providesTags: ['Reimbursement'],
    }),
    createReimbursement: builder.mutation({
      query: (payload) => ({ url: '/reimbursements', method: 'post', data: payload }),
      invalidatesTags: ['Reimbursement'],
    }),
    approveManagerReimbursement: builder.mutation({
      query: (id) => ({ url: `/reimbursements/${id}/manager-approve`, method: 'put' }),
      invalidatesTags: ['Reimbursement'],
    }),
    approveFinanceReimbursement: builder.mutation({
      query: (id) => ({ url: `/reimbursements/${id}/finance-approve`, method: 'put' }),
      invalidatesTags: ['Reimbursement'],
    }),
    rejectReimbursement: builder.mutation({
      query: ({ id, reason }) => ({ url: `/reimbursements/${id}/reject`, method: 'put', data: { reason } }),
      invalidatesTags: ['Reimbursement'],
    }),
    deleteReimbursement: builder.mutation({
      query: (id) => ({ url: `/reimbursements/${id}`, method: 'delete' }),
      invalidatesTags: ['Reimbursement'],
    }),

    // Support Tickets — every role can see this (list auto-scopes to createdBy for non-privileged
    // roles; School Admin/Principal/VP see the whole school's tickets).
    getSupportTickets: builder.query({
      query: (params) => ({ url: '/support-tickets', params }),
      providesTags: ['SupportTicket'],
    }),
    createSupportTicket: builder.mutation({
      query: (payload) => ({ url: '/support-tickets', method: 'post', data: payload }),
      invalidatesTags: ['SupportTicket'],
    }),
    updateSupportTicketStatus: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/support-tickets/${id}/status`, method: 'patch', data: payload }),
      invalidatesTags: ['SupportTicket'],
    }),

    // Admission Inquiries — pre-admission lead tracking, distinct from actual student enrollment.
    getAdmissionInquiries: builder.query({
      query: (params) => ({ url: '/admission-inquiries', params }),
      providesTags: ['AdmissionInquiry'],
    }),
    getAdmissionInquiryStats: builder.query({
      query: () => ({ url: '/admission-inquiries/stats' }),
      providesTags: ['AdmissionInquiry'],
    }),
    createAdmissionInquiry: builder.mutation({
      query: (payload) => ({ url: '/admission-inquiries', method: 'post', data: payload }),
      invalidatesTags: ['AdmissionInquiry'],
    }),
    updateAdmissionInquiry: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/admission-inquiries/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['AdmissionInquiry'],
    }),
    deleteAdmissionInquiry: builder.mutation({
      query: (id) => ({ url: `/admission-inquiries/${id}`, method: 'delete' }),
      invalidatesTags: ['AdmissionInquiry'],
    }),

    // Student Admission — always creates a brand-new Student User; father/mother are looked up by
    // email (reused if an active account already exists) or created fresh otherwise.
    createStudentAdmission: builder.mutation({
      query: (payload) => ({ url: '/student/register', method: 'post', data: payload }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Academic Years — needed for Student Promotion's From/To year pickers (promotion moves
    // students into a DIFFERENT academic year, so the single "active" year on the user's own
    // profile isn't enough here).
    getAcademicYearsBySchool: builder.query({
      query: (schoolId) => ({ url: `/academicYear/school/${schoolId}` }),
    }),
    getActiveAcademicYear: builder.query({
      query: (schoolId) => ({ url: `/academicYear/active/${schoolId}` }),
    }),
    createAcademicYear: builder.mutation({
      query: (payload) => ({ url: '/academicYear/create', method: 'post', data: payload }),
      invalidatesTags: ['AcademicYear'],
    }),
    updateAcademicYear: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/academicYear/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['AcademicYear'],
    }),
    deleteAcademicYear: builder.mutation({
      query: (id) => ({ url: `/academicYear/${id}`, method: 'delete' }),
      invalidatesTags: ['AcademicYear'],
    }),
    activateAcademicYear: builder.mutation({
      query: (id) => ({ url: `/academicYear/activate/${id}`, method: 'post' }),
      invalidatesTags: ['AcademicYear'],
    }),
    archiveAcademicYear: builder.mutation({
      query: (id) => ({ url: `/academicYear/archive/${id}`, method: 'post' }),
      invalidatesTags: ['AcademicYear'],
    }),

    // Chapters & Topics (Academics, Super Admin) — keyed by boardClassId (a BoardClass entity,
    // not a raw board+class pair) + subjectId. Unpaginated getAllChapters, not the paginated
    // /chapters/visible (that one's meant for Student/Parent browsing).
    getChapters: builder.query({
      query: (params) => ({ url: '/chapters', params }),
      providesTags: ['Chapter'],
    }),
    createChapter: builder.mutation({
      query: (payload) => ({ url: '/chapters', method: 'post', data: payload }),
      invalidatesTags: ['Chapter'],
    }),
    updateChapter: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/chapters/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['Chapter'],
    }),
    deleteChapter: builder.mutation({
      query: (id) => ({ url: `/chapters/${id}`, method: 'delete' }),
      invalidatesTags: ['Chapter'],
    }),

    // Attendance analytics (Super Admin, no schoolId = platform-wide) — already includes a
    // per-school breakdown server-side (schoolStats), reused for SchoolWiseReports alongside
    // getFinanceSummary's own per-school topSchools breakdown.
    getAttendanceSummary: builder.query({
      query: (params) => ({ url: '/analytics/attendance', params }),
    }),

    // Global Config (System Control) — single platform-wide settings doc; no logo upload here
    // (plain JSON, same reasoning as Schools/Profile — multer skips non-multipart requests).
    getGlobalConfig: builder.query({
      query: () => ({ url: '/global-config' }),
      providesTags: ['GlobalConfig'],
    }),
    updateGlobalConfig: builder.mutation({
      query: (payload) => ({ url: '/global-config', method: 'put', data: payload }),
      invalidatesTags: ['GlobalConfig'],
    }),

    // Master Configurations (Super Admin) — Departments/Designations feed the Employee-creation
    // dropdowns built earlier for School Admin's CreateUserView.
    getDepartments: builder.query({
      query: () => ({ url: '/departments' }),
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation({
      query: (payload) => ({ url: '/departments', method: 'post', data: payload }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/departments/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({ url: `/departments/${id}`, method: 'delete' }),
      invalidatesTags: ['Department'],
    }),
    getDesignations: builder.query({
      query: () => ({ url: '/designations' }),
      providesTags: ['Designation'],
    }),
    createDesignation: builder.mutation({
      query: (payload) => ({ url: '/designations', method: 'post', data: payload }),
      invalidatesTags: ['Designation'],
    }),
    updateDesignation: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/designations/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Designation'],
    }),
    deleteDesignation: builder.mutation({
      query: (id) => ({ url: `/designations/${id}`, method: 'delete' }),
      invalidatesTags: ['Designation'],
    }),

    // Activity Logs (Reports & Analytics) — distinct from System Control's own AuditLogs (a
    // separate model/route, not built yet).
    getActivityLogs: builder.query({
      query: (params) => ({ url: '/activity-logs', params }),
      providesTags: ['ActivityLog'],
    }),
    deleteActivityLog: builder.mutation({
      query: (id) => ({ url: `/activity-logs/${id}`, method: 'delete' }),
      invalidatesTags: ['ActivityLog'],
    }),

    // Audit Logs (System Control, Super Admin) — a separate, richer-filtered system-wide trail,
    // distinct from ActivityLog above. CSV export is skipped (same reasoning as every other
    // deferred file download in this app — needs a new native file-system/sharing dependency).
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/audit-logs', params }),
      providesTags: ['AuditLog'],
    }),
    getAuditLogFilters: builder.query({
      query: () => ({ url: '/audit-logs/filters' }),
    }),

    // Class Sections (Academics, Super Admin) — a read-only student-of-Classes explorer, distinct
    // from the Classes screen's own subject-teacher view.
    // Fixed: was '/section' (singular) — the real mount is '/sections' (plural, see
    // registerRoutes.js). Unused elsewhere before this fix, so risk-free to correct.
    getSections: builder.query({
      query: (params) => ({ url: '/sections', params }),
      providesTags: ['Class'],
    }),

    // Boards / Board Classes (Academics, Super Admin) — global curriculum boards (CBSE/ICSE/etc.)
    // and their per-board class list, distinct from a school's own SchoolClass records.
    getBoards: builder.query({
      query: (params) => ({ url: '/boards', params }),
      providesTags: ['Board'],
    }),
    createBoard: builder.mutation({
      query: (payload) => ({ url: '/boards', method: 'post', data: payload }),
      invalidatesTags: ['Board'],
    }),
    updateBoard: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/boards/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Board'],
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({ url: `/boards/${id}`, method: 'delete' }),
      invalidatesTags: ['Board'],
    }),
    getGlobalClasses: builder.query({
      query: (params) => ({ url: '/class', params }),
    }),
    getBoardClasses: builder.query({
      query: (boardId) => ({ url: '/board-classes', params: { boardId } }),
      providesTags: ['BoardClass'],
    }),
    createBoardClass: builder.mutation({
      query: (payload) => ({ url: '/board-classes', method: 'post', data: payload }),
      invalidatesTags: ['BoardClass'],
    }),
    deleteBoardClass: builder.mutation({
      query: (id) => ({ url: `/board-classes/${id}`, method: 'delete' }),
      invalidatesTags: ['BoardClass'],
    }),

    // FAQs (Support Center) — read is open to any authenticated role, write is Super Admin only.
    getFaqs: builder.query({
      query: () => ({ url: '/faqs' }),
      providesTags: ['Faq'],
    }),
    createFaq: builder.mutation({
      query: (payload) => ({ url: '/faqs', method: 'post', data: payload }),
      invalidatesTags: ['Faq'],
    }),
    updateFaq: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/faqs/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['Faq'],
    }),
    deleteFaq: builder.mutation({
      query: (id) => ({ url: `/faqs/${id}`, method: 'delete' }),
      invalidatesTags: ['Faq'],
    }),

    // Student Promotion — bulk-moves enrollments from one academic year/class to the next; skips
    // any student already enrolled in the target year.
    getPromotionCandidates: builder.query({
      query: (params) => ({ url: '/student/promotion/candidates', params }),
    }),
    promoteStudents: builder.mutation({
      query: (payload) => ({ url: '/student/promotion/promote', method: 'post', data: payload }),
      invalidatesTags: ['StudentProfile'],
    }),

    // Create User — the web app's "Add Staff" flow is 2 separate calls: register the bare User
    // (with a role), then create its Employee profile. No role-specific sub-document is created by
    // the first call alone.
    getRolesBySchool: builder.query({
      query: (schoolId) => ({ url: '/role/by-school', params: { schoolId } }),
      providesTags: ['Role'],
    }),
    // getAllRoles (unlike by-school) also includes global/system roles (schoolId: null) — needed
    // for the full Roles/Permissions screens, not just a per-school picker.
    getAllRoles: builder.query({
      query: () => ({ url: '/role/getAllRoles' }),
      providesTags: ['Role'],
    }),
    createRole: builder.mutation({
      query: (payload) => ({ url: '/role/createRole', method: 'post', data: payload }),
      invalidatesTags: ['Role'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({ url: `/role/deleteRole/${id}`, method: 'delete' }),
      invalidatesTags: ['Role'],
    }),

    // Temporary Access (Super Admin only) — time-boxed role grants, separate from the Role model
    // itself.
    getTempAccessGrants: builder.query({
      query: () => ({ url: '/role/temp-access' }),
      providesTags: ['TempAccess'],
    }),
    createTempAccessGrant: builder.mutation({
      query: (payload) => ({ url: '/role/temp-access', method: 'post', data: payload }),
      invalidatesTags: ['TempAccess'],
    }),
    revokeTempAccessGrant: builder.mutation({
      query: (id) => ({ url: `/role/temp-access/${id}/revoke`, method: 'patch' }),
      invalidatesTags: ['TempAccess'],
    }),
    deleteTempAccessGrant: builder.mutation({
      query: (id) => ({ url: `/role/temp-access/${id}`, method: 'delete' }),
      invalidatesTags: ['TempAccess'],
    }),
    registerUser: builder.mutation({
      query: (payload) => ({ url: '/user/register', method: 'post', data: payload }),
      invalidatesTags: ['User'],
    }),
    registerEmployee: builder.mutation({
      query: (payload) => ({ url: '/employee', method: 'post', data: payload }),
      invalidatesTags: ['User'],
    }),
    // Employee directory — powers the employeeId pickers across the Payroll sub-system
    // (Salary Structures/Advance/Bonus/Reimbursements all reference Employee._id, not User._id).
    getEmployees: builder.query({
      query: (params) => ({ url: '/employee', params }),
      providesTags: ['User'],
    }),
    // Transport Manager's Drivers roster (DriversView) — same PUT /employee/updateEmployee/:id
    // controller CreateUserView's step 2 doesn't use but web's DriversPage.jsx edit modal does;
    // employee.routes.js's EMPLOYEE_UPDATE_ROLES already includes Transport Manager for this
    // exact route.
    updateEmployee: builder.mutation({
      query: ({ id, payload }) => ({ url: `/employee/updateEmployee/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['User'],
    }),

    // Exam creation/management — same Exam model the read-only getExams (above) lists; School
    // Admin/Teacher/Principal/VP/Exam+Subject Coordinator can all create.
    createExam: builder.mutation({
      query: (payload) => ({ url: '/exams', method: 'post', data: payload }),
      invalidatesTags: ['Exam'],
    }),
    // Paper Builder (School Admin) — same PUT /exams/:id updateExam controller CreateExamSheet's
    // edit flow would use, just writing paperBlueprint instead. Exam.model.js's paperBlueprint
    // schema path was missing until recently (silently dropped under Mongoose strict mode even
    // though PageBuilder.jsx has always sent it) — confirmed fixed before building this.
    updateExam: builder.mutation({
      query: ({ examId, payload }) => ({ url: `/exams/${examId}`, method: 'put', data: payload }),
      invalidatesTags: ['Exam'],
    }),

    // Admit Cards — generation is idempotent (returns the existing set if already generated).
    getExamAdmitCards: builder.query({
      query: (examId) => ({ url: `/exams/${examId}/admit-cards` }),
      providesTags: ['AdmitCard'],
    }),
    generateExamAdmitCards: builder.mutation({
      query: (examId) => ({ url: `/exams/${examId}/admit-cards/generate`, method: 'post' }),
      invalidatesTags: ['AdmitCard'],
    }),

    // Exam Analytics — distinct from the online-attempt performance summary (getExamPerformanceSummary)
    // and the offline class-result summary; this is attempts + evaluation + risk-level insight.
    getExamAnalytics: builder.query({
      query: (examId) => ({ url: `/exams/${examId}/analytics` }),
    }),

    // Seat Plan — computed on the fly (not persisted), simple round-robin room/seat assignment
    // over the exam's enrolled roster; found to have real backend support after all (initially
    // assumed deferred alongside Paper Builder).
    getExamSeatPlan: builder.query({
      query: ({ examId, roomCapacity }) => ({ url: `/exams/${examId}/seat-plan`, params: { roomCapacity } }),
    }),

    // Events — School Admin gets full CRUD (matching web's events.jsx); Student/Parent get a
    // read-only agenda list. Note: the web app's own Student/Parent AcademicCalendar.jsx has a
    // real bug reading a nonexistent `eventType`/`date` field instead of `type`/`startDate` —
    // built here against the correct fields, not that bug. The month-grid calendar UI itself is
    // simplified to a plain agenda list (avoiding a heavy calendar-grid component).
    getEvents: builder.query({
      query: (params) => ({ url: '/events', params }),
      providesTags: ['SchoolEvent'],
    }),
    getEventStats: builder.query({
      query: () => ({ url: '/events/stats' }),
      providesTags: ['SchoolEvent'],
    }),
    createEvent: builder.mutation({
      query: (payload) => ({ url: '/events', method: 'post', data: payload }),
      invalidatesTags: ['SchoolEvent'],
    }),
    deleteEvent: builder.mutation({
      query: (id) => ({ url: `/events/${id}`, method: 'delete' }),
      invalidatesTags: ['SchoolEvent'],
    }),

    // Timetable — School Admin's builder (class+section grid, time slots, rooms). School Admin
    // is in TIMETABLE_MANAGE server-side, so full CRUD is genuinely available (unlike, say,
    // Payroll's admin console). Bulk-save/copy-week are deferred as v2 polish, not core.
    getClassSectionTimetable: builder.query({
      query: ({ schoolClassId, sectionId, academicYearId }) => ({
        url: `/timetable/class-section/${schoolClassId}/${sectionId}`,
        params: { academicYearId },
      }),
      providesTags: ['TimetableEntry'],
    }),
    createTimetableEntry: builder.mutation({
      query: (payload) => ({ url: '/timetable', method: 'post', data: payload }),
      invalidatesTags: ['TimetableEntry'],
    }),
    updateTimetableEntry: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/timetable/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['TimetableEntry'],
    }),
    deleteTimetableEntry: builder.mutation({
      query: (id) => ({ url: `/timetable/${id}`, method: 'delete' }),
      invalidatesTags: ['TimetableEntry'],
    }),

    getTimeSlots: builder.query({
      query: ({ academicYearId }) => ({ url: '/timetable/time-slots', params: { academicYearId } }),
      providesTags: ['TimeSlot'],
    }),
    createTimeSlot: builder.mutation({
      query: (payload) => ({ url: '/timetable/time-slots', method: 'post', data: payload }),
      invalidatesTags: ['TimeSlot'],
    }),
    deleteTimeSlot: builder.mutation({
      query: (id) => ({ url: `/timetable/time-slots/${id}`, method: 'delete' }),
      invalidatesTags: ['TimeSlot'],
    }),

    getTimetableRooms: builder.query({
      query: () => ({ url: '/timetable/rooms' }),
      providesTags: ['TimetableRoom'],
    }),
    createTimetableRoom: builder.mutation({
      query: (payload) => ({ url: '/timetable/rooms', method: 'post', data: payload }),
      invalidatesTags: ['TimetableRoom'],
    }),
    deleteTimetableRoom: builder.mutation({
      query: (id) => ({ url: `/timetable/rooms/${id}`, method: 'delete' }),
      invalidatesTags: ['TimetableRoom'],
    }),

    // IT Support — System Maintenance (real CRUD, /maintenance-tasks) and Network Status (a
    // single unauthenticated /health ping, polled client-side; no create/update/delete).
    getMaintenanceTasks: builder.query({
      query: () => ({ url: '/maintenance-tasks' }),
      providesTags: ['MaintenanceTask'],
    }),
    createMaintenanceTask: builder.mutation({
      query: (payload) => ({ url: '/maintenance-tasks', method: 'post', data: payload }),
      invalidatesTags: ['MaintenanceTask'],
    }),
    updateMaintenanceTask: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/maintenance-tasks/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['MaintenanceTask'],
    }),
    deleteMaintenanceTask: builder.mutation({
      query: (id) => ({ url: `/maintenance-tasks/${id}`, method: 'delete' }),
      invalidatesTags: ['MaintenanceTask'],
    }),
    getHealthStatus: builder.query({
      query: () => ({ url: '/health' }),
    }),

    // Counselor — Counseling Sessions and Appointments are the SAME CounselingSession model/
    // endpoints, just filtered by `type` ("Session" vs "Appointment"); Student Profiles has no
    // dedicated backend of its own either — the web page derives a synthetic per-student list by
    // grouping these same session records client-side, and Reports reads the /stats aggregation.
    getCounselingSessions: builder.query({
      query: (params) => ({ url: '/counseling-sessions', params }),
      providesTags: ['CounselingSession'],
    }),
    getCounselingSessionStats: builder.query({
      query: () => ({ url: '/counseling-sessions/stats' }),
      providesTags: ['CounselingSession'],
    }),
    createCounselingSession: builder.mutation({
      query: (payload) => ({ url: '/counseling-sessions', method: 'post', data: payload }),
      invalidatesTags: ['CounselingSession'],
    }),
    updateCounselingSession: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/counseling-sessions/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['CounselingSession'],
    }),
    deleteCounselingSession: builder.mutation({
      query: (id) => ({ url: `/counseling-sessions/${id}`, method: 'delete' }),
      invalidatesTags: ['CounselingSession'],
    }),

    // Security — Emergency Alerts (real CRUD, /emergency-alerts, distinct from GateEntry's
    // Entry Register/Gate Logs above which already reuse VisitorManagementScreen).
    getEmergencyAlerts: builder.query({
      query: (params) => ({ url: '/emergency-alerts', params }),
      providesTags: ['EmergencyAlert'],
    }),
    raiseEmergencyAlert: builder.mutation({
      query: (payload) => ({ url: '/emergency-alerts', method: 'post', data: payload }),
      invalidatesTags: ['EmergencyAlert'],
    }),
    resolveEmergencyAlert: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/emergency-alerts/${id}/resolve`, method: 'patch', data: payload }),
      invalidatesTags: ['EmergencyAlert'],
    }),
    deleteEmergencyAlert: builder.mutation({
      query: (id) => ({ url: `/emergency-alerts/${id}`, method: 'delete' }),
      invalidatesTags: ['EmergencyAlert'],
    }),

    // Class Teacher — "My Class" reads the ClassTeacherAssignment collection directly (a
    // different, richer model than Section.classTeacherId used by AssignedClasses/MyStudents),
    // via the same /class-teacher-assignments API the web ClassTeacherAssignmentPage.jsx uses.
    getMyClassTeacherAssignment: builder.query({
      query: () => ({ url: '/class-teacher-assignments/my' }),
    }),

    // ── Shared "pick a class → section → student" building blocks (schoolClass.routes.js
    // READ_ROLES / student.routes.js's /roll-numbers role list — cover every role with a screen
    // using this picker: School Admin/Principal/Vice Principal/Teacher/Class Teacher/Medical
    // Officer/Sports Teacher and more). Reused across Health Records, Certificates, ID Cards,
    // Discipline, Alumni, and PTM session creation's student/class pickers instead of one-off
    // duplicates per screen.
    getSchoolClassDetails: builder.query({
      query: (params) => ({ url: '/school-class/class-detailes', params }),
      providesTags: ['Class'],
    }),
    getClassRollNumbers: builder.query({
      query: (params) => ({ url: '/student/roll-numbers', params }),
    }),

    // ── Health Records (Medical Officer's core function; also School Admin/Principal/Vice
    // Principal read+write per the same HEALTH_ROLES gate as web's healthRecord.routes.js).
    // getHealthVisits with no studentId returns ALL visits for the school (denormalized
    // studentName/className/sectionName already on each visit) — this is the one Health Records
    // capability Medical Officer CAN reach without the class/section picker above, so it's the
    // screen's primary view, not a secondary filter.
    getHealthProfile: builder.query({
      query: (studentId) => ({ url: `/health-records/profile/${studentId}` }),
      providesTags: (result, error, studentId) => [{ type: 'HealthRecord', id: studentId }],
    }),
    upsertHealthProfile: builder.mutation({
      query: ({ studentId, ...payload }) => ({ url: `/health-records/profile/${studentId}`, method: 'put', data: payload }),
      invalidatesTags: (result, error, { studentId }) => [{ type: 'HealthRecord', id: studentId }],
    }),
    getHealthVisits: builder.query({
      query: (params) => ({ url: '/health-records/visits', params }),
      providesTags: ['HealthVisit'],
    }),
    createHealthVisit: builder.mutation({
      query: (payload) => ({ url: '/health-records/visits', method: 'post', data: payload }),
      invalidatesTags: ['HealthVisit'],
    }),
    getHealthVisitById: builder.query({
      query: (id) => ({ url: `/health-records/visits/${id}` }),
    }),
    updateHealthVisit: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/health-records/visits/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['HealthVisit'],
    }),

    // ── Certificates (manage: Super Admin/School Admin/Principal/Vice Principal; self-service:
    // Student/Parent via /my, parameterless — resolves across all of a Parent's linked children
    // server-side, see certificate.controllers.js's resolveMyStudentIds). PDF download is
    // deliberately not wired here, matching AdmitCardView.jsx's own documented precedent (needs a
    // native file-system/sharing dependency this app doesn't have yet) — these screens cover
    // generate/list/revoke/view, the same scope that screen settled on.
    generateCertificate: builder.mutation({
      query: (payload) => ({ url: '/certificates/generate', method: 'post', data: payload }),
      invalidatesTags: ['Certificate'],
    }),
    getCertificates: builder.query({
      query: (params) => ({ url: '/certificates', params }),
      providesTags: ['Certificate'],
    }),
    getCertificateById: builder.query({
      query: (id) => ({ url: `/certificates/${id}` }),
    }),
    revokeCertificate: builder.mutation({
      query: ({ id, revokeReason }) => ({ url: `/certificates/${id}/revoke`, method: 'patch', data: { revokeReason } }),
      invalidatesTags: ['Certificate'],
    }),
    getMyCertificates: builder.query({
      query: () => ({ url: '/certificates/my' }),
      providesTags: ['Certificate'],
    }),

    // ── ID Cards (same role split as Certificates). Employee ID cards (holderType: "Employee")
    // are out of scope for now — the generate sheet only covers Student, the primary gap-report
    // driver; the backend already supports Employee holders if this gets extended later.
    generateIdCard: builder.mutation({
      query: (payload) => ({ url: '/id-cards/generate', method: 'post', data: payload }),
      invalidatesTags: ['IDCard'],
    }),
    getIdCards: builder.query({
      query: (params) => ({ url: '/id-cards', params }),
      providesTags: ['IDCard'],
    }),
    getIdCardById: builder.query({
      query: (id) => ({ url: `/id-cards/${id}` }),
    }),
    deactivateIdCard: builder.mutation({
      query: (id) => ({ url: `/id-cards/${id}/deactivate`, method: 'patch' }),
      invalidatesTags: ['IDCard'],
    }),
    getMyIdCards: builder.query({
      query: () => ({ url: '/id-cards/my' }),
      providesTags: ['IDCard'],
    }),

    // ── Discipline Tracking (Super Admin/School Admin/Principal/Vice Principal/Teacher/Class
    // Teacher — same DISCIPLINE_ROLES gate as web's disciplineIncident.routes.js). No Parent/
    // Student endpoint exists on the backend, so no self-service screen for this module.
    createIncident: builder.mutation({
      query: (payload) => ({ url: '/discipline-incidents', method: 'post', data: payload }),
      invalidatesTags: ['DisciplineIncident'],
    }),
    getIncidents: builder.query({
      query: (params) => ({ url: '/discipline-incidents', params }),
      providesTags: ['DisciplineIncident'],
    }),
    getIncidentById: builder.query({
      query: (id) => ({ url: `/discipline-incidents/${id}` }),
    }),
    updateIncident: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/discipline-incidents/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['DisciplineIncident'],
    }),
    getStudentDisciplineSummary: builder.query({
      query: (studentId) => ({ url: `/discipline-incidents/student/${studentId}/summary` }),
    }),

    // ── PTM (Parent-Teacher Meetings). Staff (Super Admin/School Admin/Principal/Vice Principal/
    // Teacher/Class Teacher) manage sessions; Parent (+ Super Admin/School Admin) books slots —
    // same PTM_STAFF_ROLES/PTM_PARENT_ROLES split as web's ptm.routes.js.
    createPTMSession: builder.mutation({
      query: (payload) => ({ url: '/ptm/sessions', method: 'post', data: payload }),
      invalidatesTags: ['PTMSession'],
    }),
    getPTMSessions: builder.query({
      query: (params) => ({ url: '/ptm/sessions', params }),
      providesTags: ['PTMSession'],
    }),
    getPTMSessionSlots: builder.query({
      query: (id) => ({ url: `/ptm/sessions/${id}/slots` }),
      providesTags: ['PTMSession'],
    }),
    cancelPTMSession: builder.mutation({
      query: (id) => ({ url: `/ptm/sessions/${id}/cancel`, method: 'patch' }),
      invalidatesTags: ['PTMSession'],
    }),
    markPTMAttendance: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/ptm/slots/${id}/attendance`, method: 'patch', data: payload }),
      invalidatesTags: ['PTMSession'],
    }),
    getAvailablePTMSlots: builder.query({
      query: (params) => ({ url: '/ptm/slots/available', params }),
      providesTags: ['PTMSession'],
    }),
    getMyPTMBookings: builder.query({
      query: () => ({ url: '/ptm/slots/my-bookings' }),
      providesTags: ['PTMSession'],
    }),
    bookPTMSlot: builder.mutation({
      query: ({ id, studentId }) => ({ url: `/ptm/slots/${id}/book`, method: 'post', data: { studentId } }),
      invalidatesTags: ['PTMSession'],
    }),
    cancelPTMBooking: builder.mutation({
      query: (id) => ({ url: `/ptm/slots/${id}/cancel-booking`, method: 'patch' }),
      invalidatesTags: ['PTMSession'],
    }),

    // ── Sports / Co-curricular. Manage: Super Admin/School Admin/Principal/Vice Principal/Sports
    // Teacher, same SPORTS_ROLES gate as web's sports.routes.js. Self-service: Student/Parent via
    // /achievements/my, same parameterless pre-aggregated pattern as Certificates/ID Cards.
    createSportsTeam: builder.mutation({
      query: (payload) => ({ url: '/sports/teams', method: 'post', data: payload }),
      invalidatesTags: ['SportsTeam'],
    }),
    getSportsTeams: builder.query({
      query: (params) => ({ url: '/sports/teams', params }),
      providesTags: ['SportsTeam'],
    }),
    updateSportsTeam: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/sports/teams/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['SportsTeam'],
    }),
    deleteSportsTeam: builder.mutation({
      query: (id) => ({ url: `/sports/teams/${id}`, method: 'delete' }),
      invalidatesTags: ['SportsTeam'],
    }),
    addSportsTeamMember: builder.mutation({
      query: ({ id, studentId, position }) => ({ url: `/sports/teams/${id}/members`, method: 'post', data: { studentId, position } }),
      invalidatesTags: ['SportsTeam'],
    }),
    removeSportsTeamMember: builder.mutation({
      query: ({ id, studentId }) => ({ url: `/sports/teams/${id}/members/${studentId}`, method: 'delete' }),
      invalidatesTags: ['SportsTeam'],
    }),
    createSportsEvent: builder.mutation({
      query: (payload) => ({ url: '/sports/events', method: 'post', data: payload }),
      invalidatesTags: ['SportsEvent'],
    }),
    getSportsEvents: builder.query({
      query: (params) => ({ url: '/sports/events', params }),
      providesTags: ['SportsEvent'],
    }),
    updateSportsEvent: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/sports/events/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['SportsEvent'],
    }),
    createAchievement: builder.mutation({
      query: (payload) => ({ url: '/sports/achievements', method: 'post', data: payload }),
      invalidatesTags: ['Achievement'],
    }),
    getAchievements: builder.query({
      query: (params) => ({ url: '/sports/achievements', params }),
      providesTags: ['Achievement'],
    }),
    deleteAchievement: builder.mutation({
      query: (id) => ({ url: `/sports/achievements/${id}`, method: 'delete' }),
      invalidatesTags: ['Achievement'],
    }),
    getMyAchievements: builder.query({
      query: () => ({ url: '/sports/achievements/my' }),
      providesTags: ['Achievement'],
    }),

    // ── Alumni (Super Admin/School Admin/Principal/Vice Principal only — no self-service, per
    // web's alumniProfile.routes.js and the user's own scope decision for this batch).
    markAsAlumni: builder.mutation({
      query: (payload) => ({ url: '/alumni/mark', method: 'post', data: payload }),
      invalidatesTags: ['Alumni'],
    }),
    getAlumni: builder.query({
      query: (params) => ({ url: '/alumni', params }),
      providesTags: ['Alumni'],
    }),
    getAlumniById: builder.query({
      query: (id) => ({ url: `/alumni/${id}` }),
    }),
    updateAlumniProfile: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/alumni/${id}`, method: 'patch', data: payload }),
      invalidatesTags: ['Alumni'],
    }),

    // ── Canteen (Super Admin/School Admin/Principal/Vice Principal only — a counter/POS
    // operation, same CANTEEN_ROLES gate as web's canteen.routes.js). Wallet top-up is Cash only —
    // Razorpay checkout is deliberately not ported, same reasoning already established in this
    // app's own PayInstallmentSheet.jsx (needs react-native-razorpay, a new native dependency
    // requiring a dev-client rebuild — not wired up rather than shipping a fake button).
    createCanteenItem: builder.mutation({
      query: (payload) => ({ url: '/canteen/items', method: 'post', data: payload }),
      invalidatesTags: ['CanteenItem'],
    }),
    getCanteenItems: builder.query({
      query: (params) => ({ url: '/canteen/items', params }),
      providesTags: ['CanteenItem'],
    }),
    updateCanteenItem: builder.mutation({
      query: ({ id, ...payload }) => ({ url: `/canteen/items/${id}`, method: 'put', data: payload }),
      invalidatesTags: ['CanteenItem'],
    }),
    deleteCanteenItem: builder.mutation({
      query: (id) => ({ url: `/canteen/items/${id}`, method: 'delete' }),
      invalidatesTags: ['CanteenItem'],
    }),
    getCanteenWallet: builder.query({
      query: (studentId) => ({ url: `/canteen/wallet/${studentId}` }),
      providesTags: ['CanteenWallet'],
    }),
    topUpCanteenCash: builder.mutation({
      query: ({ studentId, amount }) => ({ url: `/canteen/wallet/${studentId}/topup`, method: 'post', data: { amount } }),
      invalidatesTags: ['CanteenWallet'],
    }),
    getCanteenTransactions: builder.query({
      query: (studentId) => ({ url: `/canteen/wallet/${studentId}/transactions` }),
    }),
    createCanteenOrder: builder.mutation({
      query: (payload) => ({ url: '/canteen/orders', method: 'post', data: payload }),
      invalidatesTags: ['CanteenOrder', 'CanteenWallet'],
    }),
    getCanteenOrders: builder.query({
      query: (params) => ({ url: '/canteen/orders', params }),
      providesTags: ['CanteenOrder'],
    }),
    cancelCanteenOrder: builder.mutation({
      query: (id) => ({ url: `/canteen/orders/${id}/cancel`, method: 'patch' }),
      invalidatesTags: ['CanteenOrder', 'CanteenWallet'],
    }),

    // ── School Setup wizard (School Admin) — board assignment, school-class/section CRUD, and
    // subject mapping. Academic year, global board catalog, board-class catalog, school classes,
    // class-teacher assignment, subjects, and users already have working endpoints above and are
    // reused directly; these are the pieces that were missing.
    assignSchoolBoard: builder.mutation({
      query: ({ schoolId, boardId }) => ({ url: '/boards/assignSchool-boards', method: 'put', data: { schoolId, boardId } }),
      invalidatesTags: ['SchoolBoard'],
    }),
    getSchoolBoards: builder.query({
      query: (schoolId) => ({ url: `/boards/school-boards/${schoolId}` }),
      providesTags: ['SchoolBoard'],
    }),
    removeSchoolBoard: builder.mutation({
      query: ({ schoolId, boardId }) => ({ url: '/boards/removeAssignSchool-boards', method: 'put', data: { schoolId, boardId } }),
      invalidatesTags: ['SchoolBoard'],
    }),
    createSchoolClass: builder.mutation({
      query: (payload) => ({ url: '/school-class', method: 'post', data: payload }),
      invalidatesTags: ['Class'],
    }),
    deleteSchoolClass: builder.mutation({
      query: (id) => ({ url: `/school-class/${id}`, method: 'delete' }),
      invalidatesTags: ['Class'],
    }),
    createSection: builder.mutation({
      query: (payload) => ({ url: '/sections', method: 'post', data: payload }),
      invalidatesTags: ['Class'],
    }),
    deleteSection: builder.mutation({
      query: (id) => ({ url: `/sections/${id}`, method: 'delete' }),
      invalidatesTags: ['Class'],
    }),
    // Replaces the section's subjects array wholesale — not a merge (matches backend behavior).
    addSubjectToSection: builder.mutation({
      query: (payload) => ({ url: '/sections/add-subjects', method: 'post', data: payload }),
      invalidatesTags: ['Class'],
    }),

    // ── Payroll Settings (PF/ESI/statutory rules) — Super Admin/School Admin/Accountant per
    // payroll.routes.js's FULL_ACCESS_ROLES; web only wires this into School Admin's own sidebar
    // today, but the backend has always allowed Accountant full read+write here.
    getPayrollSettings: builder.query({
      query: () => ({ url: '/payroll/settings' }),
      providesTags: ['PayrollSettings'],
    }),
    savePayrollSettings: builder.mutation({
      query: (payload) => ({ url: '/payroll/settings', method: 'post', data: payload }),
      invalidatesTags: ['PayrollSettings'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetDashboardRoleOverviewQuery,
  useGetSchoolAdminAnalyticsQuery,
  useGetMyStudentTimetableQuery,
  useGetMyTeacherTimetableQuery,
  useGetTeacherTimetableForQuery,
  useGetChildTimetableQuery,
  useGetMyChildrenQuery,
  useGetMyAttendanceQuery,
  useGetAssignedClassesQuery,
  useGetStudentsByRoleQuery,
  useGetStudentsListQuery,
  useMarkBulkAttendanceMutation,
  useRegisterDeviceTokenMutation,
  useUnregisterDeviceTokenMutation,
  useGetStudentDetailsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useChangePasswordMutation,
  useGetStudentProfileQuery,
  useUpdateStudentProfileMutation,
  useGetMyEnrollmentQuery,
  useGetMyFeesSummaryQuery,
  useGetFeeInstallmentsQuery,
  useGetMyLibraryBooksQuery,
  useGetMyTransportQuery,
  useGetMyHostelQuery,
  useGetChildLibraryBooksQuery,
  useGetChildTransportQuery,
  useGetChildHostelQuery,
  useGetChildHomeworkQuery,
  useGenerateFeeInstallmentsMutation,
  usePayInstallmentMutation,
  useGetStudentsBySchoolQuery,
  usePayStudentFeeMutation,
  useGetStudentFeeSummaryQuery,
  useGetPaymentsQuery,
  useGetPaymentSummaryQuery,
  useGetAllUsersQuery,
  useGetClassDetailsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useGetSchoolReportQuery,
  useGetReportsQuery,
  useCreateReportMutation,
  useDeleteReportMutation,
  useGetAcademicSummaryQuery,
  useGetFinanceSummaryQuery,
  useGetMyHomeworkQuery,
  useSubmitHomeworkMutation,
  useGetTeacherHomeworkQuery,
  useCreateTeacherHomeworkMutation,
  useGetHomeworkSubmissionsQuery,
  useGradeSubmissionMutation,
  useGetIncomeRecordsQuery,
  useGetIncomeSummaryQuery,
  useCreateIncomeRecordMutation,
  useDeleteIncomeRecordMutation,
  useGetExpenseRecordsQuery,
  useGetExpenseSummaryQuery,
  useCreateExpenseRecordMutation,
  useDeleteExpenseRecordMutation,
  useGetBooksQuery,
  useCreateBookMutation,
  useUpdateBookMutation,
  useDeleteBookMutation,
  useGetFineSummaryQuery,
  useCollectFineMutation,
  useGetLibrarySettingsQuery,
  useUpdateLibrarySettingsMutation,
  useGetTransportRoutesQuery,
  useCreateTransportRouteMutation,
  useDeleteTransportRouteMutation,
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetMaintenanceRecordsQuery,
  useGetMaintenanceStatsQuery,
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
  useGetGateEntriesQuery,
  useGetGateEntryStatsQuery,
  useCreateGateEntryMutation,
  useMarkGateExitMutation,
  useDeleteGateEntryMutation,
  useGetCallLogsQuery,
  useCreateCallLogMutation,
  useDeleteCallLogMutation,
  useGetHostelRoomsQuery,
  useCreateHostelRoomMutation,
  useDeleteHostelRoomMutation,
  useAssignStudentToRoomMutation,
  useRemoveStudentFromRoomMutation,
  useGetHostelVisitorsQuery,
  useCreateVisitorEntryMutation,
  useMarkVisitorExitMutation,
  useDeleteVisitorEntryMutation,
  useGetHostelComplaintsQuery,
  useCreateHostelComplaintMutation,
  useUpdateHostelComplaintMutation,
  useDeleteHostelComplaintMutation,
  useGetTodayHostelAttendanceSheetQuery,
  useMarkHostelAttendanceMutation,
  useGetHostelAttendanceQuery,
  useGetHostelAttendanceSummaryQuery,
  useActivateUserAccountMutation,
  useDeactivateUserAccountMutation,
  useGetAllSchoolsQuery,
  useActivateSchoolAccountMutation,
  useDeactivateSchoolAccountMutation,
  useDeleteSchoolAccountMutation,
  useRegisterSchoolMutation,
  useGetSchoolSubscriptionQuery,
  useRenewSchoolSubscriptionMutation,
  useCancelSchoolSubscriptionMutation,
  useSuspendSchoolSubscriptionMutation,
  useReactivateSchoolSubscriptionMutation,
  useChangeSchoolPlanMutation,
  useGetSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeactivateSubscriptionPlanMutation,
  useGetAllInvoicesQuery,
  useGetAllSubscriptionPaymentsQuery,
  useGetRevenueSummaryQuery,
  useGenerateSchoolInvoiceMutation,
  useAddManualPaymentMutation,
  useGetIssuedBooksQuery,
  useIssueBookToStudentMutation,
  useReturnIssuedBookMutation,
  useDeleteIssuedBookMutation,
  useGetHostelWardenDashboardQuery,
  useGetExamsQuery,
  useGetMyExamResultsQuery,
  useGetChildExamResultsQuery,
  useGetExamAttemptsQuery,
  useGetActiveExamAttemptQuery,
  useGetExamAttemptByIdQuery,
  useStartExamAttemptMutation,
  useAutosaveExamAnswerMutation,
  useSubmitExamAttemptMutation,
  useGetMessageRecipientsQuery,
  useGetMessagesQuery,
  useGetMessageThreadQuery,
  useSendMessageMutation,
  useMarkMessageReadMutation,
  useArchiveMessageMutation,
  useDeleteMessageForMeMutation,
  useGetMyLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useCancelLeaveRequestMutation,
  useGetLeaveRequestsForSchoolQuery,
  useApproveLeaveRequestMutation,
  useRejectLeaveRequestMutation,
  useGetMyPayrollSummaryQuery,
  // These 24 hooks (Payroll structures/cycles/advances/bonuses/reimbursements + the employee
  // directory picker) were defined as endpoints but never re-exported here, so every screen that
  // imported them (SalaryStructuresView, MonthlyRunView, PayslipCenterView,
  // PayrollMonthlyReportsView, SalaryAdvanceView, BonusIncentivesView, ReimbursementsView, and
  // their Create*Sheet companions) was importing `undefined` and would crash the instant it tried
  // to call the hook.
  useGetPayrollStructuresQuery,
  useCreatePayrollStructureMutation,
  useGetLatestPayrollCycleQuery,
  useGetPayrollCycleQuery,
  useGeneratePayrollCycleMutation,
  useLockPayrollCycleMutation,
  usePayPayrollCycleMutation,
  useGetMonthlyPayrollReportQuery,
  useGetAdvancesQuery,
  useCreateAdvanceMutation,
  useApproveAdvanceMutation,
  useRejectAdvanceMutation,
  useCloseAdvanceMutation,
  useGetBonusesQuery,
  useCreateBonusMutation,
  useApproveBonusMutation,
  useCancelBonusMutation,
  useGetReimbursementsQuery,
  useCreateReimbursementMutation,
  useApproveManagerReimbursementMutation,
  useApproveFinanceReimbursementMutation,
  useRejectReimbursementMutation,
  useDeleteReimbursementMutation,
  useGetEmployeesQuery,
  useUpdateEmployeeMutation,
  useGetEventsQuery,
  useGetEventStatsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetClassSectionTimetableQuery,
  useCreateTimetableEntryMutation,
  useUpdateTimetableEntryMutation,
  useDeleteTimetableEntryMutation,
  useGetTimeSlotsQuery,
  useCreateTimeSlotMutation,
  useDeleteTimeSlotMutation,
  useGetTimetableRoomsQuery,
  useCreateTimetableRoomMutation,
  useDeleteTimetableRoomMutation,
  useGetLessonPlansQuery,
  useCreateLessonPlanMutation,
  useGetStudyMaterialsQuery,
  useCreateStudyMaterialMutation,
  useGetMyTasksQuery,
  useUpdateMyTaskStatusMutation,
  useGetAssignableUsersQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetSelfAttendanceStatusQuery,
  useCheckInSelfAttendanceMutation,
  useCheckOutSelfAttendanceMutation,
  useGetSelfAttendanceHistoryQuery,
  useGetQuestionsQuery,
  useEnterExamMarksBulkMutation,
  useGetExamPerformanceSummaryQuery,
  useGetExamReportsQuery,
  useGetMonthlyAttendanceReportQuery,
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useGetFeeHeadsBySchoolQuery,
  useCreateFeeHeadMutation,
  useGetAttendanceRecordsQuery,
  useAssignClassTeacherMutation,
  useGetFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useAssignFeesToStudentsMutation,
  useGetAssignableTransportStudentsQuery,
  useGetTransportAssignmentsQuery,
  useSaveTransportAssignmentMutation,
  useDeleteTransportAssignmentMutation,
  useGetNotificationAnalyticsQuery,
  useCreateNotificationMutation,
  useGetSupportTicketsQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketStatusMutation,
  useGetAdmissionInquiriesQuery,
  useGetAdmissionInquiryStatsQuery,
  useCreateAdmissionInquiryMutation,
  useUpdateAdmissionInquiryMutation,
  useDeleteAdmissionInquiryMutation,
  useCreateStudentAdmissionMutation,
  useGetAcademicYearsBySchoolQuery,
  useGetActiveAcademicYearQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useDeleteAcademicYearMutation,
  useActivateAcademicYearMutation,
  useArchiveAcademicYearMutation,
  useGetChaptersQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useDeleteChapterMutation,
  useGetAttendanceSummaryQuery,
  useGetGlobalConfigQuery,
  useUpdateGlobalConfigMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useGetActivityLogsQuery,
  useDeleteActivityLogMutation,
  useGetSectionsQuery,
  useGetBoardsQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useGetGlobalClassesQuery,
  useGetBoardClassesQuery,
  useCreateBoardClassMutation,
  useDeleteBoardClassMutation,
  useGetPromotionCandidatesQuery,
  usePromoteStudentsMutation,
  useGetRolesBySchoolQuery,
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetTempAccessGrantsQuery,
  useCreateTempAccessGrantMutation,
  useRevokeTempAccessGrantMutation,
  useDeleteTempAccessGrantMutation,
  useRegisterUserMutation,
  useRegisterEmployeeMutation,
  useCreateExamMutation,
  useUpdateExamMutation,
  useGetExamAdmitCardsQuery,
  useGenerateExamAdmitCardsMutation,
  useGetExamAnalyticsQuery,
  useGetExamSeatPlanQuery,
  useGetBackupSummaryQuery,
  useGetSystemBackupsQuery,
  useCreateManualBackupMutation,
  useDeleteSystemBackupMutation,
  useGetBackupAuditLogsQuery,
  useGetBackupSchedulesQuery,
  useCreateBackupScheduleMutation,
  useUpdateBackupScheduleMutation,
  useDeleteBackupScheduleMutation,
  useGetRestoreJobsQuery,
  useRequestRestoreJobMutation,
  useApproveRestoreJobMutation,
  useRunRestoreJobMutation,
  useGetAuditLogsQuery,
  useGetAuditLogFiltersQuery,
  useGetMaintenanceTasksQuery,
  useCreateMaintenanceTaskMutation,
  useUpdateMaintenanceTaskMutation,
  useDeleteMaintenanceTaskMutation,
  useGetHealthStatusQuery,
  useGetCounselingSessionsQuery,
  useGetCounselingSessionStatsQuery,
  useCreateCounselingSessionMutation,
  useUpdateCounselingSessionMutation,
  useDeleteCounselingSessionMutation,
  useGetEmergencyAlertsQuery,
  useRaiseEmergencyAlertMutation,
  useResolveEmergencyAlertMutation,
  useDeleteEmergencyAlertMutation,
  useGetMyClassTeacherAssignmentQuery,
  useGetSchoolClassDetailsQuery,
  useGetClassRollNumbersQuery,
  useGetHealthProfileQuery,
  useUpsertHealthProfileMutation,
  useGetHealthVisitsQuery,
  useCreateHealthVisitMutation,
  useGetHealthVisitByIdQuery,
  useUpdateHealthVisitMutation,
  useGenerateCertificateMutation,
  useGetCertificatesQuery,
  useGetCertificateByIdQuery,
  useRevokeCertificateMutation,
  useGetMyCertificatesQuery,
  useGenerateIdCardMutation,
  useGetIdCardsQuery,
  useGetIdCardByIdQuery,
  useDeactivateIdCardMutation,
  useGetMyIdCardsQuery,
  useCreateIncidentMutation,
  useGetIncidentsQuery,
  useGetIncidentByIdQuery,
  useUpdateIncidentMutation,
  useGetStudentDisciplineSummaryQuery,
  useCreatePTMSessionMutation,
  useGetPTMSessionsQuery,
  useGetPTMSessionSlotsQuery,
  useCancelPTMSessionMutation,
  useMarkPTMAttendanceMutation,
  useGetAvailablePTMSlotsQuery,
  useGetMyPTMBookingsQuery,
  useBookPTMSlotMutation,
  useCancelPTMBookingMutation,
  useCreateSportsTeamMutation,
  useGetSportsTeamsQuery,
  useUpdateSportsTeamMutation,
  useDeleteSportsTeamMutation,
  useAddSportsTeamMemberMutation,
  useRemoveSportsTeamMemberMutation,
  useCreateSportsEventMutation,
  useGetSportsEventsQuery,
  useUpdateSportsEventMutation,
  useCreateAchievementMutation,
  useGetAchievementsQuery,
  useDeleteAchievementMutation,
  useGetMyAchievementsQuery,
  useMarkAsAlumniMutation,
  useGetAlumniQuery,
  useGetAlumniByIdQuery,
  useUpdateAlumniProfileMutation,
  useCreateCanteenItemMutation,
  useGetCanteenItemsQuery,
  useUpdateCanteenItemMutation,
  useDeleteCanteenItemMutation,
  useGetCanteenWalletQuery,
  useTopUpCanteenCashMutation,
  useGetCanteenTransactionsQuery,
  useCreateCanteenOrderMutation,
  useGetCanteenOrdersQuery,
  useCancelCanteenOrderMutation,
  useAssignSchoolBoardMutation,
  useGetSchoolBoardsQuery,
  useRemoveSchoolBoardMutation,
  useCreateSchoolClassMutation,
  useDeleteSchoolClassMutation,
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useAddSubjectToSectionMutation,
  useGetPayrollSettingsQuery,
  useSavePayrollSettingsMutation,
} = apiSlice;

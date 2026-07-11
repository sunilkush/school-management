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
  tagTypes: ['Attendance', 'Notifications', 'Fees', 'Homework', 'Income', 'Expense', 'Book', 'TransportRoute', 'Vehicle', 'HostelRoom', 'User', 'School', 'IssuedBook', 'Message', 'LeaveRequest', 'SchoolEvent', 'TimetableEntry', 'TimeSlot', 'TimetableRoom', 'StudentProfile', 'LessonPlan', 'StudyMaterial', 'Task', 'SelfAttendance', 'Question', 'Marks', 'Inventory', 'FeeHead', 'Class'],
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
    generateFeeInstallments: builder.mutation({
      query: (payload) => ({ url: '/fee-installments/generate', method: 'post', data: payload }),
      invalidatesTags: ['Fees'],
    }),
    payInstallment: builder.mutation({
      query: (payload) => ({ url: '/payments', method: 'post', data: payload }),
      invalidatesTags: ['Fees'],
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
    deleteBook: builder.mutation({
      query: (id) => ({ url: `/book/${id}`, method: 'delete' }),
      invalidatesTags: ['Book'],
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
      query: ({ roomId, studentName }) => ({ url: `/hostel/rooms/${roomId}/assign`, method: 'post', data: { studentName } }),
      invalidatesTags: ['HostelRoom'],
    }),
    removeStudentFromRoom: builder.mutation({
      query: ({ roomId, studentId }) => ({ url: `/hostel/rooms/${roomId}/students/${studentId}`, method: 'delete' }),
      invalidatesTags: ['HostelRoom'],
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
    // cards/seat-plan (School Admin/Principal/Teacher), marks entry + evaluation (Teacher), and
    // online exam-taking (Student, a full timed-quiz engine) are all deferred as disproportionate
    // for a first mobile pass. Note: ExamResult.studentId refs User, not Student — unlike most of
    // this app's other student-scoped data — verified directly against the model before building.
    getExams: builder.query({
      query: ({ academicYearId, studentId } = {}) => ({ url: '/exam', params: { academicYearId, studentId, limit: 50 } }),
    }),
    getMyExamResults: builder.query({
      query: () => ({ url: '/exam/results/student' }),
    }),
    getChildExamResults: builder.query({
      query: (studentUserId) => ({ url: `/exam/results/parent/${studentUserId}` }),
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
    // PayrollSelfServicePage.jsx exactly: one GET, no writes. Full admin payroll management
    // (structures, cycle generate/lock/pay, advances, bonuses, reimbursements) is a separate,
    // much larger stateful workflow deferred entirely (School Admin only on web).
    getMyPayrollSummary: builder.query({
      query: () => ({ url: '/payroll/self/summary' }),
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
  useGenerateFeeInstallmentsMutation,
  usePayInstallmentMutation,
  useGetAllUsersQuery,
  useGetClassDetailsQuery,
  useGetSchoolClassesQuery,
  useGetSubjectsQuery,
  useGetSchoolReportQuery,
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
  useDeleteBookMutation,
  useGetTransportRoutesQuery,
  useCreateTransportRouteMutation,
  useDeleteTransportRouteMutation,
  useGetVehiclesQuery,
  useCreateVehicleMutation,
  useDeleteVehicleMutation,
  useGetHostelRoomsQuery,
  useCreateHostelRoomMutation,
  useDeleteHostelRoomMutation,
  useAssignStudentToRoomMutation,
  useRemoveStudentFromRoomMutation,
  useActivateUserAccountMutation,
  useDeactivateUserAccountMutation,
  useGetAllSchoolsQuery,
  useActivateSchoolAccountMutation,
  useDeactivateSchoolAccountMutation,
  useDeleteSchoolAccountMutation,
  useGetIssuedBooksQuery,
  useIssueBookToStudentMutation,
  useReturnIssuedBookMutation,
  useDeleteIssuedBookMutation,
  useGetHostelWardenDashboardQuery,
  useGetExamsQuery,
  useGetMyExamResultsQuery,
  useGetChildExamResultsQuery,
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
  useGetSelfAttendanceStatusQuery,
  useCheckInSelfAttendanceMutation,
  useCheckOutSelfAttendanceMutation,
  useGetSelfAttendanceHistoryQuery,
  useGetQuestionsQuery,
  useEnterExamMarksBulkMutation,
  useGetExamPerformanceSummaryQuery,
  useGetMonthlyAttendanceReportQuery,
  useGetGeofenceSettingsQuery,
  useUpdateGeofenceSettingsMutation,
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useGetFeeHeadsBySchoolQuery,
  useCreateFeeHeadMutation,
  useGetAttendanceRecordsQuery,
  useAssignClassTeacherMutation,
} = apiSlice;

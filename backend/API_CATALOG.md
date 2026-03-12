# Backend API Catalog

Total discovered route handlers: **190**

## Query features supported
- Pagination: `page`, `limit`
- Sorting: `sort` (comma separated, prefix field with `-` for desc)
- Search: `search` (implemented on aggregation-based list APIs like users)
- Filtering: pass field filters as query params (e.g. `isActive=true`, `schoolId=<id>`)

## Endpoints

### academicYear.routes.js
- `POST /api/v1/academicYear/create`
- `GET /api/v1/academicYear/school/:schoolId`
- `GET /api/v1/academicYear/active/:schoolId`
- `GET /api/v1/academicYear/:id`
- `PUT /api/v1/academicYear/:id`
- `DELETE /api/v1/academicYear/:id`
- `POST /api/v1/academicYear/activate/:id`
- `POST /api/v1/academicYear/archive/:id`

### activity.routes.js
- `POST /api/v1/activity-logs/`
- `GET /api/v1/activity-logs/`
- `DELETE /api/v1/activity-logs/:id`

### attempt.routes.js
- `POST /api/v1/attempt/start`
- `POST /api/v1/attempt/submit`
- `POST /api/v1/attempt/evaluate`
- `GET /api/v1/attempt/:id`
- `GET /api/v1/attempt/`

### attendance.routes.js
- `POST /api/v1/attendance/mark`
- `GET /api/v1/attendance/`
- `GET /api/v1/attendance/daily`
- `GET /api/v1/attendance/monthly`
- `GET /api/v1/attendance/class-monthly`
- `GET /api/v1/attendance/export/excel`
- `GET /api/v1/attendance/export/pdf`
- `PUT /api/v1/attendance/:id`
- `DELETE /api/v1/attendance/:id`

### boards.routes.js
- `POST /api/v1/boards/`
- `GET /api/v1/boards/`
- `GET /api/v1/boards/:id`
- `PUT /api/v1/boards/assignSchool-boards`
- `PUT /api/v1/boards/removeAssignSchool-boards`
- `PUT /api/v1/boards/:id`
- `DELETE /api/v1/boards/:id`

### boardsClass.routes.js
- `POST /api/v1/board-classes/`
- `GET /api/v1/board-classes/`
- `GET /api/v1/board-classes/:id`
- `PUT /api/v1/board-classes/:id`
- `DELETE /api/v1/board-classes/:id`

### book.routes.js
- `POST /api/v1/books/`
- `GET /api/v1/books/`
- `GET /api/v1/books/:bookId`
- `PUT /api/v1/books/:bookId`
- `DELETE /api/v1/books/:bookId`

### chapters.routes.js
- `POST /api/v1/chapters/`
- `GET /api/v1/chapters/visible`
- `GET /api/v1/chapters/`
- `GET /api/v1/chapters/:id`
- `PATCH /api/v1/chapters/:id`
- `DELETE /api/v1/chapters/:id`
- `POST /api/v1/chapters/assign-school`

### class.routes.js
- `POST /api/v1/class/create`
- `GET /api/v1/class/all`
- `GET /api/v1/class/assign-teacher`
- `POST /api/v1/class/assign-subjects`
- `GET /api/v1/class/:schoolClassId`
- `PUT /api/v1/class/:schoolClassId`
- `DELETE /api/v1/class/:schoolClassId`

### dashboard.routes.js
- `GET /api/v1/dashboard/summary`

### employee.routes.js
- `POST /api/v1/employee/`
- `GET /api/v1/employee/allEmployee`
- `GET /api/v1/employee/getEmployee/:id`
- `PUT /api/v1/employee/updateEmployee/:id`
- `DELETE /api/v1/employee/deleteEmployee/:id`

### exam.report.routes.js
- `GET /api/v1/exam-report/exam/:examId`
- `GET /api/v1/exam-report/student/:studentId`
- `GET /api/v1/exam-report/exam/:examId/summary`
- `GET /api/v1/exam-report/`
- `GET /api/v1/exam-report/export/excel`
- `GET /api/v1/exam-report/export/pdf`

### exam.routes.js
- `POST /api/v1/exams/`
- `GET /api/v1/exams/`
- `POST /api/v1/exams/attempt/start`
- `POST /api/v1/exams/attempt/submit`
- `POST /api/v1/exams/attempt/evaluate`
- `GET /api/v1/exams/:id`
- `PUT /api/v1/exams/:id`
- `DELETE /api/v1/exams/:id`
- `PUT /api/v1/exams/:id/publish`

### fee.routes.js
- `POST /api/v1/fees/createFees`
- `GET /api/v1/fees/allFees`
- `PUT /api/v1/fees/:id`
- `DELETE /api/v1/fees/:id`

### feeHead.routes.js
- `POST /api/v1/fee-heads/`
- `GET /api/v1/fee-heads/`
- `GET /api/v1/fee-heads/by-school`
- `PUT /api/v1/fee-heads/:id`
- `DELETE /api/v1/fee-heads/:id`

### feeInstallment.routes.js
- `POST /api/v1/fee-installments/generate`
- `GET /api/v1/fee-installments/`

### feeReport.routes.js
- `GET /api/v1/fees/report/`

### feeStructure.routes.js
- `POST /api/v1/fee-structures/`
- `GET /api/v1/fee-structures/`
- `PUT /api/v1/fee-structures/:id`
- `DELETE /api/v1/fee-structures/:id`

### hostal.routes.js
- `POST /api/v1/hostal/createHostals`
- `GET /api/v1/hostal/getHostals`
- `GET /api/v1/hostal/hostelSingle/:id`
- `PUT /api/v1/hostal/hostelUpdate/:id`
- `DELETE /api/v1/hostal/hostelDelete/:id`

### index.js
- `GET /`

### issuedBooks.routes.js
- `POST /api/v1/issuedBooks/issue`
- `GET /api/v1/issuedBooks/`
- `GET /api/v1/issuedBooks/student`
- `PUT /api/v1/issuedBooks/return/:id`
- `DELETE /api/v1/issuedBooks/:id`

### loginLog.routes.js
- `POST /api/v1/login-logs/`
- `GET /api/v1/login-logs/user/:userId`
- `GET /api/v1/login-logs/school/:schoolId`
- `GET /api/v1/login-logs/academic-year/:academicYearId`
- `POST /api/v1/login-logs/`
- `GET /api/v1/login-logs/`
- `PUT /api/v1/login-logs/:id/logout`
- `GET /api/v1/login-logs/stats`

### payment.routes.js
- `POST /api/v1/payments/`
- `GET /api/v1/payments/`
- `GET /api/v1/payments/:id`
- `GET /api/v1/payments/summary`
- `POST /api/v1/payments/razorpay/verify`
- `POST /api/v1/payments/razorpay/create-order`

### question.routes.js
- `POST /api/v1/questions/create`
- `POST /api/v1/questions/bulk`
- `GET /api/v1/questions/getQuestions`
- `GET /api/v1/questions/:id`
- `PUT /api/v1/questions/:id`
- `DELETE /api/v1/questions/:id`
- `PATCH /api/v1/questions/:id/toggle`

### report.routes.js
- `GET /api/v1/report/getReport`
- `POST /api/v1/report/create`
- `DELETE /api/v1/report/delete/:id`
- `GET /api/v1/report/view/:id`
- `GET /api/v1/report/school/:schoolId/academic-year/:academicYearId`

### role.routes.js
- `POST /api/v1/role/createRole`
- `GET /api/v1/role/getAllRoles`
- `GET /api/v1/role/search`
- `GET /api/v1/role/getRole/:id`
- `PUT /api/v1/role/updateRole/:id`
- `DELETE /api/v1/role/deleteRole/:id`
- `GET /api/v1/role/by-school`

### school.routes.js
- `POST /api/v1/school/register`
- `POST /api/v1/school/update/:id`
- `GET /api/v1/school/getAllSchool`
- `GET /api/v1/school/:id`
- `GET /api/v1/school/getRoleBySchool:id`
- `PUT /api/v1/school/activate/:id`
- `PUT /api/v1/school/deactivate/:schoolId`
- `DELETE /api/v1/school/delete/:schoolId`

### section.routes.js
- `POST /api/v1/section/`
- `GET /api/v1/section/`
- `PUT /api/v1/section/:id`
- `DELETE /api/v1/section/:id`

### student.routes.js
- `POST /api/v1/student/register`
- `GET /api/v1/student/all`
- `GET /api/v1/student/last-registered`
- `GET /api/v1/student/school`
- `GET /api/v1/student/my/enrollment-id`
- `GET /api/v1/student/getStudent/:id`
- `PUT /api/v1/student/update/:id`
- `DELETE /api/v1/student/delete/:id`

### studentFee.routes.js
- `POST /api/v1/student-fees/assign`
- `GET /api/v1/student-fees/my`
- `GET /api/v1/student-fees/my/:studentId`
- `PUT /api/v1/student-fees/pay/:id`
- `GET /api/v1/student-fees/summary`

### subject.routes.js
- `POST /api/v1/subject/create`
- `GET /api/v1/subject/all`
- `GET /api/v1/subject/:id`
- `PUT /api/v1/subject/:id/assign-teachers`
- `PUT /api/v1/subject/assign-schools/:id`
- `PUT /api/v1/subject/assign-teachers/:id`
- `DELETE /api/v1/subject/:id`

### subscriptionPlan.routes.js
- `GET /api/v1/subscription/allplan`
- `GET /api/v1/subscription/:id`
- `POST /api/v1/subscription/create`
- `PUT /api/v1/subscription/:id`
- `DELETE /api/v1/subscription/:id`
- `GET /api/v1/subscription/:id/logs`

### user.routes.js
- `POST /api/v1/user/login`
- `POST /api/v1/user/refresh-token`
- `POST /api/v1/user/forgot-password`
- `POST /api/v1/user/reset-password/:token`
- `GET /api/v1/user/verify-email/:token`
- `POST /api/v1/user/resend-verification`
- `POST /api/v1/user/register`
- `GET /api/v1/user/profile`
- `PUT /api/v1/user/update`
- `PUT /api/v1/user/change-password`
- `POST /api/v1/user/logout`
- `GET /api/v1/user/all`
- `PATCH /api/v1/user/delete/:id`
- `PATCH /api/v1/user/active/:id`
- `GET /api/v1/user/single/:id`

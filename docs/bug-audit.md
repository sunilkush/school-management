# Bug audit — by pattern, not one bug at a time

Bugs found so far were not one-offs: the same few mistakes repeat across controllers. This file
names each pattern precisely, says how to spot it and how to fix it, and tracks every controller
against every pattern. The audit is finished when every cell in the table is filled.

Legend: ✅ checked, no bug (or fixed) · ❌ bug found, not fixed yet · ➖ pattern does not apply · blank = not checked yet

## The patterns

### A — Another school's id accepted
**What it is:** an id from the request (studentId, userId, routeId, teamId, …) is saved or used
without checking it belongs to the caller's school. The response then populates it, returning
another school's names, emails or phones, or the record shows up on that school's pages.
**How to spot it:** `req.body.<something>Id` / `req.params.<something>Id` reaching `create`,
`$set`, `$push` or a `findById` with no `schoolId` in the same query.
**Standard fix:** look it up with `schoolId` in the filter before using it —
`assertSchoolStudents(schoolId, ids)` (utils/schoolStudents.js) for student user ids, or
`Model.exists({ _id, schoolId })` for anything else. 404 when it does not match.
**Fixed examples:** transport assignments (dd44ea1c), hostel (e1109896, 0ba043d0), sports (1c1b874d), library borrower (22439739).

### B — Two requests at once both succeed
**What it is:** a handler reads a record, checks its state ("still pending", "not full",
"not already done"), then saves in a separate step. A double-click or two staff acting together
both pass the check.
**How to spot it:** `findOne` / `findById` → `if (x.status …) throw` → change fields → `.save()`;
or `countDocuments` → compare with a cap → `create`.
**Standard fix:** one conditional update — `findOneAndUpdate({ _id, status: "pending" }, …)` and
409 when it returns null. For caps: create, recount in a fixed order (`createdAt`/`bookedAt`, `_id`),
undo the one that does not fit. For "one per person": write the unique record first as the claim.
**Fixed examples:** leave/advance/hostel-leave decisions (edd8840d), scholarships (9c255095),
hostel beds (0bcb1d6c), bus seats (0a1461bd), surveys (d6f7f2f4), PTM slots (9eb3dc2e).

### C — "Highest number + 1"
**What it is:** a running number (receipt, voucher, registration, roll) made by reading the
highest existing one and adding one. Requests arriving together get the same number; text sorting
breaks after 999.
**How to spot it:** `.sort({ <x>Number: -1 })` followed by `+ 1`, or `generateNext…(last…)`.
**Standard fix:** `nextSequence(key, seed)` (utils/sequence.js) — atomic counter, seeded once from
the highest number already issued. Reuse the number across a retry so there are no gaps.
**Fixed examples:** circulars (dcb08125), journal vouchers (8ecab517), registration/roll numbers (b0322009, 9a2fe4d9).

### D — Limit only in the form
**What it is:** the screen restricts a value (0–100, ≤ total, date order, max count) but the API
accepts anything — negative marks, 5000/100, 30 days for one day, unlimited books.
**How to spot it:** `Number(req.body.x)` saved with no range check; `InputNumber min/max` on the
frontend with no matching check in the controller; `bulkWrite` / `updateMany` (these skip model validators).
**Standard fix:** validate in the controller: finite number, inside the range, 400 with a clear message.
**Fixed examples:** homework grade (af92eb4f), online exam marks (63be66c3), bulk marks (a3322aa7),
leave days/overlap (f3946a9e), library limits (22439739).

### E — Students/parents shown other people's personal data
**What it is:** a list or populate returns email, phone or address of other users to a Student
or Parent.
**How to spot it:** `select("name email …")` / `populate(…, "name email phone")` in a handler
reachable by Student or Parent roles.
**Standard fix:** strip contact fields for Student/Parent viewers (keep name and role).
**Fixed examples:** message recipients (4466040a), message participants (ae9cde76), user record (4457562b).

### F — Wrong role or owner check
**What it is:** the route lets a role in, and the controller never checks that this particular
person owns the record (a teacher marking another teacher's exam; a student returning a book).
**How to spot it:** a route role list wider than the controller's ownership check; routes and
controllers must be read together. Additional roles: use `actingRoleName` (utils/actingRole.js).
**Standard fix:** ownership in the query (`createdBy: req.user._id`, `teacherId: …`), or remove the
unused route.
**Fixed examples:** exam evaluate route (63be66c3), library return (742ab5b4).

### G — Frontend
**What it is:** lists that filter client-side but fetch only the first page; dates sent with
`toISOString()` (day shifts in IST); user text in links/print windows/CSV.
**Standard fix:** send a `limit` the controller and its validator allow; send `YYYY-MM-DD`;
`safeHref`, `escapeHtml`, `downloadCsv`.
**Fixed examples:** see memory notes "List truncation", "Timezone = IST", "XSS: links, prints, CSV".

## Order of work

1. A and E — data leaking to other schools / other families
2. B and F — money and decisions
3. D and C
4. G

One pattern at a time across every controller, one commit per pattern sweep.

## Checklist

| Controller | A | B | C | D | E | F | Notes |
|---|---|---|---|---|---|---|---|
| academicYear | ➖ |  |  |  |  |  |  |
| accountantDashboard | ➖ |  |  |  |  |  |  |
| activity | ➖ |  |  |  |  |  |  |
| admissionInquiry | ➖ |  |  |  |  |  |  |
| advance | ✅ |  |  |  |  |  |  |
| alumniProfile | ✅ |  |  |  |  |  |  |
| amcTracking | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| analytics | ➖ |  |  |  |  |  |  |
| attempt | ✅ |  |  |  |  |  |  |
| attendance | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| attendanceDevice | ✅ |  |  |  |  |  |  |
| auditLog | ✅ |  |  |  |  |  |  |
| board | ✅ |  |  |  |  |  |  |
| boardClass | ✅ |  |  |  |  |  |  |
| bonus | ✅ |  |  |  |  |  |  |
| book | ✅ |  |  |  |  |  |  |
| callLog | ➖ |  |  |  |  |  |  |
| canteen | ✅ |  |  |  |  |  |  |
| certificate | ✅ |  |  |  |  |  |  |
| chapter | ✅ |  |  |  |  |  |  |
| circular | ✅ |  |  |  |  |  |  |
| class | ✅ |  |  |  |  |  |  |
| classTeacherAssignment | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| communicationSettings | ➖ |  |  |  |  |  |  |
| compliance | ✅ |  |  |  |  |  |  |
| counselingSession | ✅ |  |  |  |  |  |  |
| dashboard | ➖ |  |  |  |  |  |  |
| department | ➖ |  |  |  |  |  |  |
| designation | ✅ |  |  |  |  |  |  |
| deviceToken | ✅ |  |  |  |  |  |  |
| disciplineIncident | ✅ |  |  |  |  |  |  |
| emergencyAlert | ➖ |  |  |  |  |  |  |
| employee | ✅ |  |  |  |  |  | A fixed 28050d56 (could create Super Admin) |
| exam | ✅ |  |  |  |  |  |  |
| exam.report | ✅ |  |  |  |  |  |  |
| expense | ✅ |  |  |  |  |  |  |
| faq | ➖ |  |  |  |  |  |  |
| feeHead | ➖ |  |  |  |  |  |  |
| feeInstallment | ✅ |  |  |  |  |  |  |
| feeReport | ✅ |  |  |  |  |  |  |
| feeSettings | ➖ |  |  |  |  |  |  |
| feeStructure | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| gateEntry | ➖ |  |  |  |  |  |  |
| globalConfig | ➖ |  |  |  |  |  |  |
| gradingScale | ➖ |  |  |  |  |  |  |
| healthRecord | ✅ |  |  |  |  |  |  |
| hostelAttendance | ✅ |  |  |  |  |  | A fixed 0ba043d0 |
| hostelComplaint | ✅ |  |  |  |  |  | A fixed 0ba043d0 |
| hostelDashboard | ➖ |  |  |  |  |  |  |
| hostelLeave | ✅ |  |  |  |  |  | A fixed e1109896, 0ba043d0 |
| hostelRoom | ✅ |  |  |  |  |  | A fixed 0bcb1d6c |
| hostelVisitor | ✅ |  |  |  |  |  | A fixed 0ba043d0 |
| hr | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| idCard | ✅ |  |  |  |  |  |  |
| income | ✅ |  |  |  |  |  |  |
| inventory | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| ipRestriction | ➖ |  |  |  |  |  |  |
| issuedBook | ✅ |  |  |  |  |  | A fixed 22439739 |
| leaveRequest | ✅ |  |  |  |  |  |  |
| ledger | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| lessonPlan | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| libraryCard | ✅ |  |  |  |  |  |  |
| librarySetting | ➖ |  |  |  |  |  |  |
| loginLog | ✅ |  |  |  |  |  |  |
| maintenanceTask | ➖ |  |  |  |  |  |  |
| message | ✅ |  |  |  |  |  |  |
| module | ➖ |  |  |  |  |  |  |
| notification | ➖ |  |  |  |  |  |  |
| onlineClass | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| payment | ✅ |  |  |  |  |  |  |
| paymentGateway | ➖ |  |  |  |  |  |  |
| payroll | ✅ |  |  |  |  |  |  |
| platformOverview | ➖ |  |  |  |  |  |  |
| ptm | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| publicAdmission | ➖ |  |  |  |  |  |  |
| purchaseOrder | ✅ |  |  |  |  |  | A fixed 069f74f3 (also cross-school stock) |
| question | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| reimbursement | ✅ |  |  |  |  |  |  |
| report | ✅ |  |  |  |  |  |  |
| reportCard | ✅ |  |  |  |  |  |  |
| role | ➖ |  |  |  |  |  |  |
| scholarship | ✅ |  |  |  |  |  |  |
| school | ➖ |  |  |  |  |  |  |
| schoolBilling | ✅ |  |  |  |  |  |  |
| schoolClass | ✅ |  |  |  |  |  |  |
| schoolEvent | ➖ |  |  |  |  |  |  |
| section | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| selfAttendance | ➖ |  |  |  |  |  |  |
| sports | ✅ |  |  |  |  |  | A fixed 1c1b874d |
| stockIssue | ✅ |  |  |  |  |  |  |
| student | ✅ |  |  |  |  |  | A fixed 069f74f3 (roll number) |
| studentFee | ✅ |  |  |  |  |  |  |
| studentPortal | ✅ |  |  |  |  |  | A fixed 069f74f3 (dup transport route removed) |
| studyMaterial | ✅ |  |  |  |  |  |  |
| subject | ➖ |  |  |  |  |  |  |
| subscriptionPlan | ➖ |  |  |  |  |  |  |
| substitution | ✅ |  |  |  |  |  |  |
| superAdminBilling | ✅ |  |  |  |  |  | Super Admin only |
| supportTicket | ➖ |  |  |  |  |  |  |
| survey | ✅ |  |  |  |  |  |  |
| systemBackup | ✅ |  |  |  |  |  | Super Admin only |
| task | ➖ |  |  |  |  |  |  |
| tempAccess | ✅ |  |  |  |  |  | Super Admin only; not read by auth |
| textbook | ➖ |  |  |  |  |  |  |
| timetable | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| topic | ✅ |  |  |  |  |  |  |
| transport | ✅ |  |  |  |  |  | A fixed dd44ea1c |
| transportTracking | ✅ |  |  |  |  |  |  |
| twoFactor | ✅ |  |  |  |  |  |  |
| user | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| vehicleMaintenance | ✅ |  |  |  |  |  | A fixed 069f74f3 |
| vendor | ➖ |  |  |  |  |  |  |
| webhook | ➖ |  |  |  |  |  |  |

Frontend (pattern G) is tracked per page in a second table once the backend sweep is done.

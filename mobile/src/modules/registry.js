import { createModuleScreen } from './createModuleScreen';
import { notificationsModule } from './definitions/notifications';
import { leaveModule } from './definitions/leave';
import { studentsModule } from './definitions/students';
import { circularsModule } from './definitions/circulars';
import { homeworkModule } from './definitions/homework';
import { attendanceModule } from './definitions/attendance';
import { feesModule } from './definitions/fees';
import { reportCardsModule } from './definitions/reportCards';
import { messagesModule } from './definitions/messages';
import { eventsModule } from './definitions/events';
import { libraryModule } from './definitions/library';
import { gradesModule } from './definitions/grades';
import { studyMaterialsModule } from './definitions/studyMaterials';
import { onlineClassesModule } from './definitions/onlineClasses';
import { examsModule } from './definitions/exams';

// Phase 5 — Tier C: school operations
import { inventoryModule } from './definitions/inventory';
import { visitorsModule } from './definitions/visitors';
import { disciplineModule } from './definitions/discipline';
import {
  certificatesModule,
  myCertificatesModule,
  idCardsModule,
  myIdCardModule,
} from './definitions/credentials';
import { payslipsModule } from './definitions/payslips';
import { admissionsModule } from './definitions/admissions';
import { healthModule } from './definitions/health';
import { hostelModule, canteenModule } from './definitions/hostelCanteen';
import { staffModule, recruitmentModule, myAppraisalModule } from './definitions/hr';

// Phase 6 — Tier D: finance
import { incomeModule, expensesModule } from './definitions/cashbook';
import { ledgerAccountsModule, journalModule, trialBalanceModule } from './definitions/ledger';
import { scholarshipSchemesModule, scholarshipAwardsModule } from './definitions/scholarships';

// Phase 7 — Tier E: the platform
import {
  schoolsModule,
  subscriptionPlansModule,
  auditLogsModule,
  complianceModule,
} from './definitions/platform';

// Phase 9 — the destinations nearly every role has
import { myAttendanceModule, myTasksModule, supportTicketsModule } from './definitions/selfService';
import { adminAttendanceModule, attendanceReportModule } from './definitions/adminAttendance';
import {
  subjectsModule,
  lessonPlansModule,
  sportsModule,
  myAchievementsModule,
} from './definitions/academics';
import {
  classesModule,
  sectionsModule,
  boardsModule,
  academicYearsModule,
} from './definitions/schoolSetup';
import {
  questionBankModule,
  assignedClassesModule,
  ptmSessionsModule,
} from './definitions/teaching';
import { routesModule, vehiclesModule, transportAssignmentsModule } from './definitions/transportOps';
import {
  departmentsModule,
  designationsModule,
  faqsModule,
  alumniModule,
  counsellingModule,
  emergencyAlertsModule,
} from './definitions/organisation';
import { bookCatalogueModule, issuedBooksModule, librarySettingsModule } from './definitions/libraryOps';
import {
  feeStructuresModule,
  reimbursementsModule,
  myChildrenModule,
  teacherTimetableModule,
} from './definitions/financeOps';
import {
  hostelComplaintsModule,
  payrollSettingsModule,
  geofenceModule,
} from './definitions/hostelOps';

/**
 * Declarative module registry — the reason this app is not 294 hand-written screens.
 *
 * The web portal exposes ~90 modules across 24 roles. Almost all of them are the same shape:
 * a filtered list, a detail view, and a create/edit form over one REST resource. Writing three
 * bespoke screens each is what made the previous mobile app unmaintainable (376 files), so here
 * a module is DATA (`definitions/*.js`) and the generic screens in `screens/generic/` render it.
 *
 * A descriptor's contract:
 *
 *   key, title, icon        nav identity
 *   useList(ctx, { filter, scope }) a hook returning an RTK Query result. Role-dependent sources
 *                            call every hook and use `skip` to pick one, never a conditional call.
 *   scope                    optional "whose data is this?" picker, for roles that are looking at
 *                            someone else's record — a Parent choosing between their children.
 *                            { activeFor(ctx), useOptions(ctx), selectOptions(data), emptyLabel }.
 *                            The chosen value arrives back in useList's `scope`.
 *   selectRows(data)         response -> array (endpoints disagree: bare array vs { requests } vs
 *                            { students, pagination })
 *   row(row, ctx)            -> { title, subtitle, meta, badge: { label, tone }, unread }
 *   searchFields             accessors; presence of this enables the search bar
 *   filter                   chip row; `server: true` passes the value to useList instead of
 *                            filtering client-side
 *   detail                   { titleFor, fields, badgeFor, actions, useItem?, idFor?, selectItem?,
 *                              useOnOpen?, onOpenArg? }
 *   create                   { allow(ctx), fields, useMutation, buildPayload, validate? }
 *   aliases                  other nav keys that mean the same feature (two roles, two labels)
 *
 * Rules for adding one:
 *   1. Reuse an existing apiSlice endpoint — ~400 are already defined. Only add one if the backend
 *      route genuinely has no hook yet.
 *   2. Never send `schoolId` from the client. Every backend query is already tenant-scoped from
 *      the JWT; asserting it client-side is the cross-tenant hole patched in school.controllers.js.
 *   3. Gate write UI the way the BACKEND gates it. Several routes (leave approval, notification
 *      broadcast, the student roster) check role NAME, not the permissions array, and for those
 *      the permissions array can be empty even for an allowed role — so use `ctx.is(...)` there
 *      and `ctx.can(...)` only where the server really reads permissions.
 *   4. A module only earns a bespoke screen when its UI is genuinely not a list (dashboards,
 *      mark-attendance grids, the exam player, the bus map, fee payment). Those go in
 *      `screens/custom/` and are wired through CUSTOM_SCREENS in navigation/screenForModule.js.
 */
const DEFINITIONS = [
  notificationsModule,
  leaveModule,
  studentsModule,
  circularsModule,
  homeworkModule,
  attendanceModule,
  feesModule,
  reportCardsModule,
  messagesModule,
  eventsModule,
  libraryModule,
  gradesModule,
  studyMaterialsModule,
  onlineClassesModule,
  examsModule,
  inventoryModule,
  visitorsModule,
  disciplineModule,
  certificatesModule,
  myCertificatesModule,
  idCardsModule,
  myIdCardModule,
  payslipsModule,
  admissionsModule,
  healthModule,
  hostelModule,
  canteenModule,
  staffModule,
  recruitmentModule,
  myAppraisalModule,
  incomeModule,
  expensesModule,
  ledgerAccountsModule,
  journalModule,
  trialBalanceModule,
  scholarshipSchemesModule,
  scholarshipAwardsModule,
  schoolsModule,
  subscriptionPlansModule,
  auditLogsModule,
  complianceModule,
  myAttendanceModule,
  myTasksModule,
  supportTicketsModule,
  adminAttendanceModule,
  attendanceReportModule,
  subjectsModule,
  lessonPlansModule,
  sportsModule,
  myAchievementsModule,
  classesModule,
  sectionsModule,
  boardsModule,
  academicYearsModule,
  questionBankModule,
  assignedClassesModule,
  ptmSessionsModule,
  routesModule,
  vehiclesModule,
  transportAssignmentsModule,
  departmentsModule,
  designationsModule,
  faqsModule,
  alumniModule,
  counsellingModule,
  emergencyAlertsModule,
  bookCatalogueModule,
  issuedBooksModule,
  librarySettingsModule,
  feeStructuresModule,
  reimbursementsModule,
  myChildrenModule,
  teacherTimetableModule,
  hostelComplaintsModule,
  payrollSettingsModule,
  geofenceModule,
];

/**
 * The web sidebar sometimes gives one feature two different nav keys because two roles call it
 * two different things — Receptionist's "Enquiries" is School Admin's "Admission Enquiries". A
 * descriptor can list those other keys in `aliases`, and every one of them resolves to the SAME
 * screen component, so the two roles share a screen instead of one of them hitting the placeholder.
 */
export const MODULE_REGISTRY = Object.fromEntries(
  DEFINITIONS.flatMap((descriptor) => {
    const entry = { ...descriptor, screen: createModuleScreen(descriptor) };
    return [descriptor.key, ...(descriptor.aliases ?? [])].map((key) => [key, entry]);
  })
);

/** Descriptor for a nav key, or null if this module has no declarative screen yet. Anything
 * absent still gets a working nav entry — screenForModule.js falls back to the placeholder. */
export function moduleDescriptor(key) {
  return MODULE_REGISTRY[key] ?? null;
}

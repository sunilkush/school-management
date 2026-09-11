# EduOS Mobile — Build Plan

React Native (Expo) app for the school ERP in this repo. One app, **all 24 roles**, driven by the
same permission data the web portal uses.

Status: **Phases 0–7 done.** Phase 8 next.

---

## 1. Why this app looks the way it does

A previous mobile app existed twice and was deleted twice. It lives on
`archive/mobile-app-2026-09-01` (376 files, 294 screens). It failed because it tried to be a
screen-for-screen clone of the web portal — including Super Admin backup schedules and restore
jobs — so every backend change meant touching a dozen bespoke React Native files.

This rebuild keeps that app's **infrastructure** and throws away its **screens**:

| Reused from the archive | Why it was worth keeping |
| --- | --- |
| `src/api/` (client, axiosBaseQuery, authApi) | Axios + refresh-token interceptor, already correct for `Bearer` auth |
| `src/store/api/apiSlice.js` | **400 RTK Query endpoints** already mapped to real backend routes |
| `src/navigation/resolveRoleNav.js` | Role + permissions → 4 quick tabs + "More" overflow + nested groups |
| `src/constants/roles.js` | `NAV_CONFIG` / `MODULE_META` for 24 roles, mirrored from `frontend/src/config/sidebar.config.js` |
| `src/components/ui/` | 20-component kit (StatCard, Panel, QueryState, pickers, StatusPill) |
| `src/theme/` | Tokens mirroring `frontend/tailwind.config.js` — same brand as the web portal |
| `src/utils/` | Domain formatters (fees, attendance, payroll, exams, …) |

Dropped: all 294 module screens.

## 2. The core idea: modules are data, not screens

~90 modules × 24 roles cannot be hand-written twice. Almost every module is the same shape —
a filtered list, a detail view, a create/edit form over one REST resource. So a module is a
**descriptor** in `src/modules/registry.js`, and generic screens render it:

```
src/modules/definitions/<key>.js  →  { key, useList, selectRows, row,
                                        searchFields, filter, detail, create }
                                          ↓  createModuleScreen()
   ListScreen · DetailScreen · FormSheet · ActionSheet   (generic, built once)
```

The full descriptor contract is documented at the top of `src/modules/registry.js`.

A new module is a ~40-line config file, not three screens.

A bespoke screen is written **only** when the UI genuinely is not a list. Expected final count is
~15: per-role dashboards, mark-attendance, the exam player, the bus map, fee payment, the
timetable grid, the report-card viewer, chat, and the driver trip screen. These live in
`src/screens/custom/` and are wired through `CUSTOM_SCREENS` in
`src/navigation/screenForModule.js`.

Anything not yet in the registry resolves to `ModulePlaceholderScreen`, which shows the module
name and the caller's actually-granted actions. **Every role's navigation is therefore complete
and tappable from Phase 1 onward**, even though most modules aren't built.

## 3. Layout

```
mobile/
  App.jsx  app.json  eas.json  .env.example  PLAN.md
  src/
    api/            axios client + refresh interceptor
    constants/      config, roles (NAV_CONFIG + MODULE_META), permissions
    modules/        registry.js, createModuleScreen.jsx, definitions/<module>.js
    navigation/     RootNavigator, AuthStack, AppShell, TabShell, GroupMenu, resolveRoleNav
    screens/
      auth/         Login, ForgotPassword, Splash
      custom/       hand-written screens (only where a list won't do)
      generic/      ListScreen, DetailScreen, FormSheet, ActionSheet, FilterChips, ScopePicker, RoleGate
    components/ui/  shared kit
    store/          redux + RTK Query (apiSlice: 400 endpoints)
    theme/          tokens, ThemeProvider
    utils/          domain formatters
```

## 4. Phases

### Phase 0 — Scaffold ✅
Infra restored from the archive; screens excluded. Junk `test-renderer` dependency replaced with
real `react-test-renderer`. Started on SDK 54, **upgraded to SDK 57** (see below).

### Phase 1 — Auth + role shell ✅
Login → tokens into `expo-secure-store` → `bootstrapSession` → role + permissions →
`resolveRoleNav` → bottom tabs, group submenus and the "More" overflow. Every role signs in and
sees its correct navigation; unbuilt destinations land on the placeholder.

### Phase 2 — Module engine ✅
Generic `ListScreen` / `DetailScreen` / `FormSheet` / `ActionSheet` + `createModuleScreen`
factory. A descriptor with only a list stays a single screen; one with a detail or form becomes
its own stack and reports `selfHeadered` so no double header renders.

Validated against three pilot modules chosen to break the engine in different ways:

| Pilot | What it proved |
| --- | --- |
| **Notifications** | Read-only list, client-side search/filter (the endpoint offers neither), and a side effect on open — reading one marks it read |
| **Leave** | The list SOURCE depends on role (`/my` vs school-wide, picked with RTK Query `skip`), server-side status filter, a create form, and state-changing actions — including reject, which must collect a reason first |
| **Students** | Detail is a second, richer request, and the row's `_id` is the *enrollment* id while the detail endpoint wants `studentId` |

27 tests cover the wiring and every descriptor's pure logic.

Two things the pilots forced into the engine that all later modules get free: **`ActionSheet`**
(an action that needs input before firing — `Alert.prompt` is iOS-only, so an Android approver
could otherwise never reject anything) and **local-time date handling** (`toISOString()` would
shift the day for anyone east or west of UTC, silently booking the wrong leave date).

### Phase 3 — Tier A: the daily-use modules ✅

| Module | State |
| --- | --- |
| Dashboard (per role) | ✅ restored from the archive |
| Notifications | ✅ Phase 2 pilot |
| Leave | ✅ Phase 2 pilot |
| **Circulars** | ✅ new — endpoints, descriptor, and nav wired for all 23 roles |
| **Homework** | ✅ new — student / teacher / parent, via the new scope picker |
| **Attendance (view)** | ✅ new — student/parent record with a % summary |
| **Attendance (marking)** | ✅ new — bespoke roster: everyone starts present, tap only the exceptions |
| **Timetable** | ✅ new — bespoke: day tabs plus that day’s periods, opening on today |
| **Fees (view)** | ✅ new — billed / paid / due, read-only on purpose (see below). Online payment still ⬜ |
| **Report cards** | ✅ new — endpoints + descriptor; each subject expands into its own row |
| **Messages** | ✅ new — inbox/sent/archive, read-on-open, threaded reply (transcript view ⬜) |
| **Push notifications** | ⚠️ wired and contract-checked, but **unverified on a device** — see below |

**Engine addition this phase: the scope picker.** A Parent with two children is looking at *one
child's* homework, not "homework" in the abstract — and the same question blocks their view of
attendance, fees and report cards too. So a descriptor can now declare `scope`
(`activeFor` / `useOptions` / `selectOptions`), the list grows a chip row, and the choice arrives
back in `useList`. Built once here; every remaining Parent-facing module in Tier A gets it free.

**The child-id trap, which the backend is inconsistent about.** Two different endpoint families
identify the same child by two different ids, and passing the wrong one 403s:

| Module | Endpoint | Wants | Because |
| --- | --- | --- | --- |
| Homework, Attendance, Report cards | `/child/:childId/…`, `/attendance/my?childId=`, `/report-cards/child/:id` | `child.userId` | resolves via `Student.findOne({ userId })`, and `ReportCard.studentId` refs User |
| Fees, Timetable | `/student-fees/my?studentId=`, `/timetable/parent/child/:studentId` | `child._id` | resolves via `Student.findById`/`findOne({ _id })` |

There is a test asserting these stay opposite, because it is exactly the kind of thing a later
"cleanup" would happily unify and break. Getting it wrong is a 403, not a visible bug.

**Two more engine additions this phase:**

- **`summary`** — a descriptor can return stat tiles computed from the rows on screen, so they can
  never disagree with the list below them. Attendance uses it for the % (a half day counts as half
  a day present, matching the web report); Fees for billed/paid/due.
- **`servesRole` + RoleGate** — several nav keys mean different things to different roles. "Fees"
  to a parent is their child's bill; to a School Admin it is the school ledger. "Attendance" to a
  student is their own record; to an admin it is the school-wide table. The descriptors here are
  written for the family reading and their endpoints are gated to Student/Parent, so staff now get
  a plain explanation naming the phase that brings their version — rather than a 403, or worse,
  their own personal attendance record shown under an admin label.

**Fees is read-only on purpose.** `PUT /student-fees/pay/:id` exists and its ownership check does
let a Student or Parent call it for their own record — but it records a *manual* cash/cheque
payment, it is not a gateway. A pay button there would let a family clear their own dues with no
money moving. Real online payment goes through the separate FeeInstallment/Razorpay flow.

**Teachers could not mark attendance.** Only Super Admin and School Admin had a `MarkAttendance`
nav entry; Teacher, Class Teacher, Sports Teacher and Hostel Warden had only a bare `Attendance`
one — which now resolves to the read-only family view. All four are in the backend's
`STUDENT_ATTENDANCE_MARKERS`, so they have been given the marking screen.

**Push is wired but unverified.** `usePushRegistration` registers the native FCM/APNs token on
sign-in, unregisters on sign-out, sets an Android MAX-importance channel so pushes appear as
heads-up banners, and routes a tapped push to Notifications. Its payload matches the backend's
`{ token, platform }` contract, and it deliberately no-ops under Expo Go, which has had no remote
push since SDK 53. But **none of that has been run on a device** — it cannot be, without a
development build. Treat push as unproven until someone installs a dev build and watches a
notification arrive.

**Still open from this tier:** the Messages *transcript* view (replies are correctly parented, but
a whole back-and-forth is not rendered in one scroll), composing a brand-new message (needs a
recipient picker over `/messages/recipients`), online fee payment, and homework file attachments
(needs `expo-document-picker`).

### Phase 4 — Tier B: academics ✅

| Module | State |
| --- | --- |
| **Events** | ✅ new — school calendar; "upcoming" keeps a multi-day event that is still running |
| **Results** | ✅ new — per-exam marks, one row per subject |
| **Library** | ✅ new — books you are holding, with due-soon and overdue warnings |
| **Study material** | ✅ new — notes and links, opened in the device browser |
| **Online classes** | ✅ new — endpoints + descriptor; the app hosts no video (see below) |
| **Surveys** | ✅ new — bespoke, because the form is built from the survey's own questions |
| **PTM** | ✅ new — bespoke: bookings list + slot picker grouped by session |
| **Live bus** | ✅ new — bespoke, **no map yet** (a real decision, see below) |
| **Exams** | ✅ new — the exam schedule. Admit cards still ⬜ (per-exam, needs its own fetch) |

**Two more engine additions**, both forced by real modules rather than invented:

- **`stayOnSuccess`** — most actions change the record, so leaving for the list afterwards is
  right. Opening a link does not: popping the screen behind the user means they come back from the
  browser to the wrong place.
- **`onSuccess(result)`** — for actions whose whole point is the response. Joining an online class
  returns the meeting link, and that link is deliberately not in the list row.

**Online classes host no video.** The school pastes its own Meet/Zoom/Teams link and the app hands
it to the device. Two things the backend is careful about and this module preserves:

- A learner's list arrives with `meetingLink` **nulled** until the link is due to open, plus
  `canJoin` and `joinOpensAt` — so the button is honest about when class starts instead of failing
  on tap, and the link is fetched from the join response, never cached in a row.
- Joining is **not attendance**. The backend records a "join" — that someone opened a link — and
  never calls it attendance, because opening a link is not sitting through a lesson. Nothing here
  implies otherwise.

**The live bus screen has no map, on purpose.** Drawing one needs a native maps dependency and
a decision that is the school's to make: Google Maps on Android wants an API key per build, while
the web portal draws its map with Leaflet on OpenStreetMap, which would mean a WebView here
instead. Until that is settled the screen answers the question a parent actually opens it for —
*has it left, where is it, when does it reach my stop* — in words, which needs no map.

Everything it shows is the backend's own honest reporting, passed through rather than smoothed:

- The only position source is the **driver's phone**. No hardware tracker — when their app is
  closed or out of signal, positions simply stop.
- A fix older than a few minutes is **labelled as old**, and the speed from that fix is withheld
  rather than shown next to a stale timestamp.
- The ETA is an **estimate** (straight lines between stops, a flat assumed speed) and says so.
- When there is no ETA the backend explains *why* — the stop is not on the route map, the bus has
  not reported yet, the stop is already passed — and that reason is shown verbatim.
- **No polling.** The API is rate limited at ~800 requests per window; a bus screen left open on a
  timer would eat it. Pull to refresh.

**PTM is bespoke** because its two halves read different endpoints with different shapes
(`/ptm/slots/my-bookings` vs `/ptm/slots/available?schoolClassId=&sectionId=`), and the second
needs the child's class and section rather than just an id — more than `scope` hands a descriptor.
Booking is also picking one of many live slots grouped by session, which `FormSheet` cannot express.
Note the id: `bookSlot` wants **Student._id**, joining Fees and Timetable on that side of the split.

**Student and Parent got their own `MyTransport` nav key.** They previously shared `Transport` with
Transport Manager, where it means the fleet — same key, two meanings. Splitting it is what let the
bus screen exist without a role gate.

**Surveys are bespoke** because the form is built at runtime from the survey's own questions —
seven types (rating, yes/no, single and multi choice, number, short and long text), each with its
own control. `FormSheet` takes a fixed field list declared up front and cannot express that. Two
details that matter: a "No" answer is stored by identity (`value === false`), not truthiness, or a
submitted "No" would render as unanswered; and the anonymity note is shown **before** answering,
because anonymity is why someone answers honestly and irreversibility is its price.

### Phase 5 — Tier C: school operations ✅

| Module | State |
| --- | --- |
| Students | ✅ Phase 2 pilot |
| **Admissions** | ✅ new — read-write: log an enquiry and move it along the pipeline |
| **Gate register** | ✅ new — read-write: log an arrival, tap the person out |
| **My payslips** | ✅ new — employee's own pay history; no actions at all |
| **Health records** | ✅ new — sick-room log, close a visit, record a parent call |
| **Discipline** | ✅ new — incident register, resolve with a note |
| **Inventory** | ✅ new — stock and assets, low-stock filter |
| **Hostel rooms** | ✅ new — occupancy, who is in which room |
| **Canteen** | ✅ new — the menu and prices, read-only |
| **Certificates / ID cards** | ✅ new — office register (+ revoke) and the family's own copies, as separate keys |
| **Staff directory** | ✅ new — read-only; `Users` and `Members` alias to it |
| **HR — recruitment** | ✅ new — vacancies and pipeline, read-only |
| **HR — my appraisal** | ✅ new — the staff member's own review; see the two rules below |

**Where the write actions are, and are not.** Almost every Tier C module is read-only on purpose.
The two that are not — the gate register and admission enquiries — are the two where the phone is
genuinely the *right* device: a guard logging a visitor at the gate, reception taking a call from a
parent. Everything else is a considered act done at a desk with a document or a student in front of
you, and a half-fitting phone form is exactly how the wrong student ends up on the wrong record.
Where an action *is* offered it is the one that might be urgent away from a desk: revoking a
certificate, closing a sick-room visit, marking a visitor out.

**Two things a closing action must not lose.** Resolving a discipline incident requires saying what
was done, and closing a health visit requires the treatment given — both are required fields rather
than optional, because a closed record with an empty outcome is useless to whoever reads it next.

**Engine addition: `aliases`.** The web sidebar gives one feature two nav keys when two roles call
it two different things — Receptionist's "Enquiries" is School Admin's "Admission Enquiries", and
the warden's "Hostel" is the room register. A descriptor now lists those under `aliases` and every
key resolves to the *same* screen component, instead of one role silently landing on the
placeholder.

**The canteen is a price list, not a shop.** There is a wallet and an order endpoint behind it, but
taking a child's money would need a top-up flow, a parent consent trail and a refund path — none of
which exist. An honest menu beats a half-built checkout.


**The appraisal screen must not blur two things**, and the backend already enforces both:

1. **Self and reviewer scores are never merged into one number.** They are two separate opinions
   recorded side by side, so the screen lists them side by side — there is no averaged figure.
2. **The reviewer's half is hidden until the review is finalised.** The endpoint blanks it before
   then, deliberately: a half-filled reviewer form read over somebody's shoulder is worse than no
   form at all. The screen says *why* the section is missing rather than rendering empty rows that
   look like a reviewer who wrote nothing.

Submitting the self-assessment is not in the app — the form is one score per criterion and the
criteria live on the cycle, so it is a runtime-built form like Surveys. A once-a-year sit-down task
stays on the web portal.

### Phase 6 — Tier D: finance ✅

| Module | State |
| --- | --- |
| **Income / Expenses** | ✅ new — two identical cash ledgers built from one factory |
| **Chart of accounts** | ✅ new — endpoints + descriptor |
| **Journal** | ✅ new — both sides of every entry spelled out |
| **Trial balance** | ✅ new — with an explicit balanced / out-of-balance check |
| **Scholarship schemes** | ✅ new — endpoints + descriptor, with funded-place caps |
| **Scholarship awards** | ✅ new — approve / reject, gated to actual approvers |
| Fee reports | ⬜ |
| Profit & loss, balance sheet | ⬜ web portal only |

**The books are read-only from the phone, and that is not a gap to fill later.** A posted journal
entry is immutable by design — a mistake is corrected with a reversing entry, never an edit — and
most entries are not typed by anyone at all: a server-side sweep posts them from money events that
already happened. A "new journal entry" button on a phone would be inviting someone to hand-write
into a book that is meant to be a *consequence* of other records.

**Two scholarship rules the screen must not blur**, both already true in the backend:

- **Pending awards count against the cap.** A place promised is a place gone; discovering at
  approval time that the last one was taken is how a school over-commits. So `remaining` is
  already net of pending, and the detail spells that out rather than letting the arithmetic look
  wrong.
- **Percentages sum, they do not compound.** Two 20% schemes are 40% off, not 36%. Nothing here
  multiplies discounts together.

**The accounts desk cannot approve its own scholarship requests.** `APPROVERS` is deliberately
narrower than `READERS` — Accountant raises requests and reads the list; Principal and the admins
decide. The approve/reject actions mirror that exactly.

**One honest limitation on the trial balance.** `summary` only ever receives the rows currently on
screen, so the totals narrow when you search, and the endpoint's own `isBalanced` cannot be reached
from a descriptor. The footer says so outright — a balance check that silently covered only part of
the books would be worse than no check at all.

### Phase 7 — Tier E: the platform ✅

| Module | State |
| --- | --- |
| **Schools** | ✅ new — every school on the platform, read-only |
| **Subscription plans** | ✅ new — what the platform sells, read-only |
| **Audit log** | ✅ new — who did what; `ActivityLogs` aliases to it |
| **Compliance** | ✅ new — endpoints + descriptor; students not ready to file |
| Backups, restore jobs, backup schedules | ⛔ **deliberately not built** |
| Roles & permissions matrix | ⛔ **deliberately not built** |
| Global config, platform modules | ⛔ **deliberately not built** |
| Billing invoices | ⬜ |

**This is the tier that killed the previous app**, which cloned Super Admin's entire desktop
sidebar onto a phone — backup schedules, restore jobs, the permission matrix, global config — and
then had to maintain all of it. So this phase is as much about what was refused as what was built.

**What was refused, and why each one:**

- **Restore jobs and backups.** A restore is irreversible and overwrites live data. Nothing whose
  worst case is "the wrong database came back" should be one tap away on a device you use while
  walking.
- **Global config and platform modules.** These change behaviour for *every school at once*. A
  mis-tap has no blast radius limit.
- **The roles and permissions matrix.** Editing it grants access. A permission grid on a phone
  screen is how somebody gets handed the wrong module.
- **Suspending or cancelling a school's subscription.** The endpoints exist and would have been
  easy to wire; it cuts off every user in that school at once, so it stays on the web portal with
  its confirmations. The school list says so in its footer rather than hiding the capability.

What *is* here is the part a platform owner genuinely asks away from a desk: which schools are on
the system, what they are paying for, and — when something looks wrong — who touched it and when.

**The compliance wording is deliberate.** It is **not a UDISE+ integration**: no such API exists.
This is the school's own record-keeping against what UDISE+, PEN and APAAR ask for, and **nothing
is submitted to any government system from the app**. The backend also never stores a full Aadhaar
number, so there is none to display. The list shows only students who are *not* ready and **names
the missing fields**, because "incomplete" on its own tells the office nothing.

A test asserts the refused keys stay unbuilt, and another asserts the compliance footer never uses
the word "integration".

### Phase 8 — Driver + release
Driver trip start/stop with background location (`expo-location`). EAS build, icons, store
listing.

## 5. Constraints that will bite if forgotten

1. **No cookie jar in React Native.** The backend sets `accessToken` as an httpOnly cookie *and*
   returns it in the response body. Mobile must use the body token and send
   `Authorization: Bearer` on every request — `auth.middleware.js` accepts both, but only the
   header works here.
2. **Rate limit.** The API allows ~800 requests per window. Rely on RTK Query caching and
   `refetchOnFocus`; never poll on an interval.
3. **`allowPublic` does not make a route public.** Only `PUBLIC_API_ROUTE_PATTERNS` does. This
   matters for the public admission tracker in Phase 5.
4. **Never send `schoolId` from the client.** Every backend query is tenant-scoped from the JWT.
   Client-asserted tenant ids are exactly the cross-tenant hole that was patched in
   `school.controllers.js`.
5. **SDK 57** (Expo 57.0.21, React 19.2.3, React Native 0.86.3).

   ⚠️ **npm `latest` is not the same thing as "Expo Go supports it."** As of 2026-09-10 the SDK 57
   Expo Go build is still in the App Store / Play Store review queue. Installing Expo Go from a
   store and scanning the QR code gives "Project is incompatible with this version of Expo Go" —
   this project has hit that twice before. How to actually run SDK 57 today:
   - **Android (the path on this Windows machine):** `npx expo start` — Expo CLI installs the
     matching Expo Go build onto a connected device or emulator itself.
   - **iOS device:** `eas go` (needs a paid Apple Developer account), or an iOS simulator on a Mac.
   - Either way a **development build** is required for push and background location anyway
     (see #6), so this mainly affects quick QR-code testing.

   Four things the 54 → 57 upgrade needed, all of which will bite again on the next bump:
   - `newArchEnabled` and `android.edgeToEdgeEnabled` were **removed from the config schema** (both
     are defaults now). Leaving them in app.json fails config validation outright.
   - `@react-native-community/datetimepicker` **9.1.0 — the version SDK 57's compat table pins —
     has a config plugin that cannot load**: it requires `@expo/config-plugins`, which SDK 57 no
     longer hoists. 9.2.1 fixes it, so it is held there via `expo.install.exclude` in
     package.json; without that pin the next `expo install --fix` silently re-breaks the config.
   - `react-test-renderer` must be pinned **exactly** to React's version. A `^` range resolves to a
     newer patch whose own peer range excludes the React that Expo ships, and `npm install` then
     fails to build a tree at all.
   - Reanimated 4.5 pulls in `react-native-worklets`, which touches its native module at import
     time and so crashes every Jest suite. Fixed with `"resolver":
     "react-native-worklets/jest/resolver.js"` in the jest config.
6. **Expo Go is not enough for push or background location — both need a dev build.** Expo Go
   dropped remote-push support in SDK 53 (expo-notifications warns about this at import). That
   makes a dev build a **Phase 3** prerequisite, not a Phase 8 one, since Phase 3 ships push.
7. **12 modules post-date the archive** and are missing from `NAV_CONFIG` / `MODULE_META`:
   report cards, circulars, surveys, ledger, bus tracking, online classes, scholarships, HR,
   compliance, substitutions, attendance devices, public admission. Add them as their phase lands.
8. **Naming honesty.** An online-class join log is not attendance. The compliance module is not
   a "UDISE integration" — no such API exists.

## 6. Running it

```bash
cd mobile
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL to the backend, e.g. http://192.168.1.5:9000/api/v1
npx expo start
```

`localhost` will not resolve from a physical phone — use the machine's LAN IP.

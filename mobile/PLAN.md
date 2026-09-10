# EduOS Mobile — Build Plan

React Native (Expo) app for the school ERP in this repo. One app, **all 24 roles**, driven by the
same permission data the web portal uses.

Status: **Phases 0–2 done, Phase 3 in progress.**

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
      generic/      ListScreen, DetailScreen, FormSheet, ActionSheet, FilterChips, ScopePicker
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

### Phase 3 — Tier A: the daily-use modules 🚧 in progress

| Module | State |
| --- | --- |
| Dashboard (per role) | ✅ restored from the archive |
| Notifications | ✅ Phase 2 pilot |
| Leave | ✅ Phase 2 pilot |
| **Circulars** | ✅ new — endpoints, descriptor, and nav wired for all 23 roles |
| **Homework** | ✅ new — student / teacher / parent, via the new scope picker |
| Attendance (mark + view) | ⬜ mark is a bespoke grid, not a list |
| Timetable + substitutions | ⬜ bespoke grid; substitution endpoints still missing |
| Fees + Razorpay payment | ⬜ bespoke; endpoints exist |
| Report cards | ⬜ endpoints missing (post-dates the archive) |
| Messages | ⬜ bespoke (chat); endpoints exist |
| Push notifications | ⬜ `usePushRegistration` exists but is unverified; **needs a dev build** (see #6) |

**Engine addition this phase: the scope picker.** A Parent with two children is looking at *one
child's* homework, not "homework" in the abstract — and the same question blocks their view of
attendance, fees and report cards too. So a descriptor can now declare `scope`
(`activeFor` / `useOptions` / `selectOptions`), the list grows a chip row, and the choice arrives
back in `useList`. Built once here; every remaining Parent-facing module in Tier A gets it free.

The trap it encodes: the `/child/:childId/…` routes resolve a child through
`Student.findOne({ userId })`, so the picker must pass `child.userId`, **not** `child._id` — the
Student id 403s as "not authorized to access this child's data". Same class of id-mixup as the
Students module's enrollment-vs-student id.

### Phase 4 — Tier B: academics
Exams / results / admit card, Library, Transport + live bus map, Online classes (opens the
school's own meeting link — the app hosts no video), Study material, PTM, Events, Surveys.

### Phase 5 — Tier C: school operations
Students, staff, admissions (+ public admission tracker), HR (recruitment + appraisal),
Payroll / payslips, Inventory, Hostel, Canteen, Visitors, Discipline, Health, Certificates,
ID cards.

### Phase 6 — Tier D: finance
Ledger (chart of accounts, journal, statements), fee reports, expenses, income, scholarships.

### Phase 7 — Tier E: Super Admin
Schools, subscription plans, billing / invoices, backups + restore jobs, roles & permissions,
platform modules, global config, compliance.

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

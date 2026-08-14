# EduOS School — Mobile App

React Native / Expo companion app for the School Management ERP. Role-driven navigation across
23 roles (Super Admin down to Parent/Student), 290+ screens, and 400 RTK Query endpoint
definitions wired to the same backend the web app (`../frontend`) uses.

- **Expo SDK**: 54 (`~54.0.35`) — pinned on purpose. The Expo Go store client did not support
  newer SDKs at the time this was pinned; don't bump it casually, use a dev client build instead
  if you need a newer SDK.
- **React Native**: 0.81.5, React 19.1.0, New Architecture enabled (`newArchEnabled: true`).
- **State**: Redux Toolkit + redux-persist (session/auth persisted to `AsyncStorage`), RTK Query
  for all server data (`src/store/api/apiSlice.js`) via a custom `axiosBaseQuery()` wrapping a
  shared `axios` instance — no `fetch`-based `baseQuery` anywhere.
- **UI**: `react-native-paper` (Material) + a hand-rolled theme system (`src/theme/`) supporting
  light/dark.

## Running locally

```bash
npm install
cp .env.example .env   # then edit EXPO_PUBLIC_API_URL if the backend isn't on localhost:9000
npm start               # opens Expo Dev Tools; scan the QR with Expo Go, or press a/i for a
                         # simulator (needs the SDK 54-compatible Expo Go / a dev client)
```

`EXPO_PUBLIC_API_URL` defaults to `http://localhost:9000/api/v1` if unset (see
`src/constants/config.js`). On a physical device this must be your machine's LAN IP, not
`localhost` — the device can't resolve your laptop's loopback address.

### Tests

```bash
npm test          # jest-expo + @testing-library/react-native, headless
npm run test:watch
```

## Project layout

```
src/
  api/            axios instance + axiosBaseQuery() adapter for RTK Query
  components/     shared UI primitives (FormField, AccentListCard, QueryState, ErrorBoundary...)
  constants/      roles.js (NAV_CONFIG — per-role nav tree), config.js (API base URL)
  hooks/          useAuth() etc.
  navigation/     RootNavigator, screenForModule.js (nav-item -> screen component map), AppHeader
  screens/        one folder per role/domain area (schoolAdmin/, teacher/, exams/, ...)
  store/          Redux slices + the single apiSlice.js RTK Query definition
  theme/          tokens.js (palette/spacing/type scale) + ThemeProvider (light/dark)
  utils/          formatting, confirm dialogs, role-color helpers
```

Role → navigation is entirely data-driven: `src/constants/roles.js`'s `NAV_CONFIG` lists the nav
items per role, and `src/navigation/screenForModule.js`'s `SCREEN_MAP` resolves each nav item key
to its screen component. Adding a screen for an existing nav item is a two-line change (map entry
+ NAV_CONFIG entry); it does not require touching the navigator itself.

## Known scope limits (not bugs)

A handful of features are deliberately deferred rather than half-built, because they need native
Expo modules this app doesn't currently depend on (`expo-image-picker`, `expo-document-picker`,
`expo-file-system`, `expo-sharing`, a payment gateway SDK) and a real device/dev-client rebuild to
verify safely:

1. Online fee payment on mobile (cash/cheque only today — `PayInstallmentSheet.jsx`).
2. File attachments on homework submission.
3. Profile photo / school logo / ID-card photo upload.
4. In-app PDF/file downloads (admit cards, certificates, backup/audit-log exports) — these work on
   the web app today.
5. Canteen wallet top-up online (cash-only today).

Question Bank create/edit is intentionally scoped to MCQ (single answer) and True/False only —
the other three question types (`mcq_multi`, `fill_blank`, `match`) each need a materially
different answer-editor UI (see `Questions.model.js`'s per-type validation); browsing shows all
types, editing is offered only for the two supported ones.

## EAS builds

Three profiles in `eas.json`, none of them usable as-is yet:

| Profile | Purpose | Still needs |
|---|---|---|
| `development` | Local dev client, internal distribution | Nothing — `EXPO_PUBLIC_API_URL` already points at a LAN IP placeholder; edit it to match your machine. |
| `preview` | Internal QA build (Android APK) | Real staging backend URL — currently `https://staging-api.your-domain.com/api/v1`. |
| `production` | Store build (Android App Bundle) | Real production backend URL — currently `https://api.your-domain.com/api/v1`. |

`extra.eas` in `app.json` is currently `{}` — there is no linked EAS project yet. Before any real
build:

```bash
eas init              # or: eas build:configure
```

This writes a real `projectId` into `app.json`. Without it, `eas build` will fail immediately.

## Store submission checklist (buyer/operator-executed, not code)

These all require accounts and assets this repository cannot provide — listed here so nothing
gets missed, not because any of it is a code change:

- **EAS project**: `eas init` / `eas build:configure` (see above).
- **Push notifications**: `usePushRegistration.js` uses native FCM/APNs tokens, not Expo's push
  relay — create a Firebase project, download `google-services.json` (Android) /
  `GoogleService-Info.plist` (iOS), and set `FIREBASE_SERVICE_ACCOUNT_JSON` on the **backend**
  deployment (`backend/src/utils/pushService.js` no-ops gracefully without it, but push delivery
  needs it to actually send).
- **Backend URLs**: replace the placeholder `EXPO_PUBLIC_API_URL` values in `eas.json`'s
  `preview`/`production` profiles with your real deployed backend domain.
- **Privacy policy**: write and host one — required by both stores, and specifically required by
  Google Play for apps requesting location/notification permissions (this app requests both, see
  `app.json`'s `android.permissions`).
- **App icons/splash**: `assets/icon.png`, `assets/adaptive-icon.png` and `assets/splash-icon.png`
  are currently placeholder art (byte-identical files) — commission or generate real, distinct
  assets, with proper safe-zone padding on the adaptive icon.
- **Developer accounts**: Apple Developer Program ($99/yr), Google Play Console ($25 one-time).
  Fill in `eas.json`'s empty `submit.production` block with real credentials once you have them.

## What "no lint/CI" means here

There is no ESLint config and no `lint` script in `package.json` for this package — verification
during development relies on `npx expo export` (a bundler-resolution check: does every import
actually resolve and every file parse) and the Jest suite above. If you add lint tooling, wire it
into a `lint` script here rather than inventing a separate convention.

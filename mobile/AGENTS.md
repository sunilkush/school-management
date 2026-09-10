# Working in `mobile/`

Read `PLAN.md` first — it explains why this app is a module registry rather than 294 screens,
and which phase covers which module.

## Before touching the `expo` version

**npm `latest` is not the same thing as "Expo Go supports it."** The store-published Expo Go app
lags the latest SDK, sometimes by months. Bumping `expo` on the assumption that the newest SDK is
runnable has already broken this project twice with:

> Project is incompatible with this version of Expo Go

Check the Expo Go changelog for which SDK the **store client** ships, not just what npm says is
latest: <https://expo.dev/changelog>

Current state: **SDK 57** (Expo 57.0.21, React 19.2.3, React Native 0.86.3). As of 2026-09-10 the
SDK 57 Expo Go build is still in store review, so run it via `npx expo start` onto an Android
device/emulator (Expo CLI installs the matching client itself), or `eas go` on iOS.

## Pins that exist for a reason — do not "tidy" them

| Pin | Why |
| --- | --- |
| `expo.install.exclude: ["@react-native-community/datetimepicker"]` in package.json | SDK 57's compat table wants 9.1.0, whose config plugin cannot load — it requires `@expo/config-plugins`, which SDK 57 no longer hoists. 9.2.1 works. Without this exclude, the next `expo install --fix` downgrades it and app config validation breaks. |
| `react-test-renderer` pinned to an **exact** version | It must equal React's version. A `^` range resolves to a newer patch whose peer range excludes the React that Expo ships, and then `npm install` cannot build a tree at all. |
| `"resolver": "react-native-worklets/jest/resolver.js"` in the jest config | Reanimated 4.5 pulls in `react-native-worklets`, which touches its native module at import time and crashes every Jest suite without this. |

## Adding a module

Write a descriptor in `src/modules/definitions/`, register it in `src/modules/registry.js`. The
contract is documented at the top of that file. Do not write list/detail/form screens by hand —
that is what made the previous app unmaintainable.

Three rules that come from real bugs, not style:

1. **Never send `schoolId` from the client.** Every backend query is tenant-scoped from the JWT.
   Client-asserted tenant ids are the cross-tenant hole that was patched in `school.controllers.js`.
2. **Gate write UI the way the backend gates it.** Several routes (leave approval, notification
   broadcast, the student roster) check role *name*, not the permissions array — and for those the
   permissions array can be empty even for an allowed role. Use `ctx.is(...)` there,
   `ctx.can(...)` only where the server really reads permissions.
3. **Reuse `apiSlice.js`** — ~400 endpoints are already mapped. Add one only if the route genuinely
   has no hook.

## Verifying a change

```bash
npx jest              # descriptor logic + registry wiring
npx expo-doctor       # dependency/config health
npx expo export --platform android --output-dir <tmp>   # proves it actually bundles
```

None of these run the app on a device. Say so plainly rather than implying a change is confirmed
working in the real app when only the bundle succeeded.

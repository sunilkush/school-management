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
];

export const MODULE_REGISTRY = Object.fromEntries(
  DEFINITIONS.map((descriptor) => [
    descriptor.key,
    { ...descriptor, screen: createModuleScreen(descriptor) },
  ])
);

/** Descriptor for a nav key, or null if this module has no declarative screen yet. Anything
 * absent still gets a working nav entry — screenForModule.js falls back to the placeholder. */
export function moduleDescriptor(key) {
  return MODULE_REGISTRY[key] ?? null;
}

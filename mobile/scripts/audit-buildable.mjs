/**
 * Of the destinations that still have no screen, which can actually be built right now?
 *
 * `audit-nav.mjs` says what is missing. This says what is BLOCKED — a destination whose endpoints
 * are already mapped in apiSlice.js is a descriptor away, while one with nothing behind it needs
 * backend wiring first. Picking the next batch without this is guesswork.
 *
 * Matching is by name similarity against exported RTK Query hooks, so it is a strong hint rather
 * than proof — always confirm in apiSlice.js before writing the descriptor.
 *
 * Run from mobile/:  node scripts/audit-buildable.mjs
 */
import fs from 'fs';

const roles = fs.readFileSync('src/constants/roles.js', 'utf8');
const screenMap = fs.readFileSync('src/navigation/screenForModule.js', 'utf8');
const api = fs.readFileSync('src/store/api/apiSlice.js', 'utf8');

// --- what already has a screen -------------------------------------------------
const built = new Set();
for (const file of fs.readdirSync('src/modules/definitions')) {
  const src = fs.readFileSync(`src/modules/definitions/${file}`, 'utf8');
  for (const m of src.matchAll(/^ {2}key:\s*'([^']+)'/gm)) built.add(m[1]);
  for (const m of src.matchAll(/aliases:\s*\[([^\]]+)\]/g)) {
    for (const a of m[1].matchAll(/'([^']+)'/g)) built.add(a[1]);
  }
}
const cs = screenMap.indexOf('const CUSTOM_SCREENS');
for (const m of screenMap.slice(cs, screenMap.indexOf('};', cs)).matchAll(/^\s*([A-Za-z]+):\s*\w+,/gm)) {
  built.add(m[1]);
}

// --- every exported query/mutation hook ----------------------------------------
const hooks = [...api.matchAll(/^ {2}(use\w+(?:Query|Mutation)),$/gm)].map((m) => m[1]);

/** Loose containment either way, on lowercased alphanumerics. */
function hooksFor(key) {
  const needle = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (needle.length < 4) return [];
  return hooks.filter((h) => {
    const hay = h.toLowerCase().replace(/^use|query$|mutation$/g, '').replace(/[^a-z0-9]/g, '');
    return hay.includes(needle) || needle.includes(hay);
  });
}

// --- missing destinations -------------------------------------------------------
const navBody = roles.slice(roles.indexOf('export const NAV_CONFIG'));
const roleRe = /^\s{2}\[ROLE_NAMES\.([A-Z_]+)\]:/gm;
let m;
const marks = [];
while ((m = roleRe.exec(navBody))) marks.push({ name: m[1], idx: m.index });

const missing = new Map(); // key -> role count
for (let i = 0; i < marks.length; i++) {
  const seg = navBody.slice(marks[i].idx, marks[i + 1] ? marks[i + 1].idx : navBody.length);
  const at = seg.indexOf('items: [');
  if (at < 0) continue;
  const body = seg.slice(at).replace(/group:\s*'[^']*'/g, '').replace(/icon:\s*'[^']*'/g, '');
  for (const k of new Set([...body.matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map((x) => x[1]))) {
    if (built.has(k)) continue;
    missing.set(k, (missing.get(k) ?? 0) + 1);
  }
}

const ready = [];
const blocked = [];
for (const [key, roleCount] of missing) {
  const found = hooksFor(key);
  (found.length ? ready : blocked).push({ key, roleCount, hooks: found });
}
const byImpact = (a, b) => b.roleCount - a.roleCount || a.key.localeCompare(b.key);
ready.sort(byImpact);
blocked.sort(byImpact);

console.log(`Still missing a screen : ${missing.size}`);
console.log(`  endpoints look ready : ${ready.length}`);
console.log(`  nothing obvious yet  : ${blocked.length}`);

console.log('\n=== READY (a descriptor away) ===');
for (const r of ready) {
  console.log(`${String(r.roleCount).padStart(2)}  ${r.key.padEnd(26)} ${r.hooks.slice(0, 3).join(', ')}`);
}

console.log('\n=== NO MATCHING HOOK (check by hand, may need backend wiring) ===');
for (const b of blocked) console.log(`${String(b.roleCount).padStart(2)}  ${b.key}`);

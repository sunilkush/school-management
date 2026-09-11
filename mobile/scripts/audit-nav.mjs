/**
 * How much of the navigation actually has a screen?
 *
 * Every role's menu comes from NAV_CONFIG, which mirrors the web sidebar — so it contains far more
 * destinations than any one build phase covered. Anything without a registry descriptor (or alias)
 * and without a CUSTOM_SCREENS entry falls through to ModulePlaceholderScreen: it navigates, it
 * does not crash, and it shows no data.
 *
 * Run from mobile/:  node scripts/audit-nav.mjs
 */
import fs from 'fs';

// Read as text rather than importing — importing would pull in React Native.
const roles = fs.readFileSync('src/constants/roles.js', 'utf8');
const screenMap = fs.readFileSync('src/navigation/screenForModule.js', 'utf8');

// Keys that have a real screen: a descriptor's `key`, any of its `aliases`, or a custom screen.
const built = new Set();
for (const file of fs.readdirSync('src/modules/definitions')) {
  const src = fs.readFileSync(`src/modules/definitions/${file}`, 'utf8');
  // EXACTLY two spaces: a descriptor's own `key`. Detail actions carry a `key` too, nested much
  // deeper — counting those inflates the "built" number with things like 'approve' and 'reject'.
  for (const m of src.matchAll(/^ {2}key:\s*'([^']+)'/gm)) built.add(m[1]);
  for (const m of src.matchAll(/aliases:\s*\[([^\]]+)\]/g)) {
    for (const a of m[1].matchAll(/'([^']+)'/g)) built.add(a[1]);
  }
}
const start = screenMap.indexOf('const CUSTOM_SCREENS');
for (const m of screenMap.slice(start, screenMap.indexOf('};', start)).matchAll(/^\s*([A-Za-z]+):\s*[A-Za-z]+,/gm)) {
  built.add(m[1]);
}

const navBody = roles.slice(roles.indexOf('export const NAV_CONFIG'));
const roleRe = /^\s{2}\[ROLE_NAMES\.([A-Z_]+)\]:/gm;
let match;
const marks = [];
while ((match = roleRe.exec(navBody))) marks.push({ name: match[1], idx: match.index });

const missingKeys = new Map(); // key -> [roles]
const missingByRole = {};

for (let i = 0; i < marks.length; i++) {
  const seg = navBody.slice(marks[i].idx, marks[i + 1] ? marks[i + 1].idx : navBody.length);
  const itemsAt = seg.indexOf('items: [');
  if (itemsAt < 0) continue;

  const body = seg
    .slice(itemsAt)
    // A group's title and every icon name are quoted too, but neither is a destination.
    .replace(/group:\s*'[^']*'/g, '')
    .replace(/icon:\s*'[^']*'/g, '');

  const keys = [...new Set([...body.matchAll(/'([A-Za-z][A-Za-z0-9]*)'/g)].map((x) => x[1]))];
  const gone = keys.filter((k) => !built.has(k));
  if (!gone.length) continue;

  missingByRole[marks[i].name] = gone;
  for (const k of gone) {
    if (!missingKeys.has(k)) missingKeys.set(k, []);
    missingKeys.get(k).push(marks[i].name);
  }
}

console.log(`Destinations with a screen : ${built.size}`);
console.log(`Destinations with NO screen: ${missingKeys.size}`);
console.log('\n--- ranked by how many roles hit it ---');
[...missingKeys.entries()]
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
  .forEach(([key, rs]) => console.log(`${String(rs.length).padStart(2)}  ${key}`));

console.log('\n--- per role ---');
for (const [role, keys] of Object.entries(missingByRole)) {
  console.log(`${role} (${keys.length}): ${keys.join(', ')}`);
}

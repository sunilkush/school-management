/**
 * How much UI does each BUILT screen actually have?
 *
 * `audit-nav.mjs` answers "does this destination have a screen at all". This answers the next
 * question: of the ones that do, which are thin — a list you cannot tap into, or a read-only view
 * where the web portal lets you act.
 *
 * Run from mobile/:  node scripts/audit-depth.mjs
 */
import fs from 'fs';

const DEF_DIR = 'src/modules/definitions';

/** Crude but reliable: find the descriptor block for each exported module in a file. */
function descriptorsIn(src) {
  const out = [];
  const re = /export const (\w+) = ([\s\S]*?)\n};/g;
  let m;
  while ((m = re.exec(src))) out.push({ varName: m[1], body: m[2] });
  // Descriptors built by a factory (cashLedger) export a call instead of an object literal.
  const factoryRe = /export const (\w+) = \w+\(\{([\s\S]*?)\n\}\);/g;
  while ((m = factoryRe.exec(src))) out.push({ varName: m[1], body: m[2], viaFactory: true });
  return out;
}

const rows = [];
for (const file of fs.readdirSync(DEF_DIR)) {
  const src = fs.readFileSync(`${DEF_DIR}/${file}`, 'utf8');
  for (const d of descriptorsIn(src)) {
    const keyMatch = d.body.match(/^\s*key:\s*'([^']+)'/m);
    if (!keyMatch) continue;
    const aliases = [...(d.body.match(/aliases:\s*\[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1]);

    // A descriptor built by a factory (cashLedger) only passes its OWN options at the call site —
    // detail, actions and the rest live in the factory body. Judging such a descriptor by its call
    // site alone reports it as a bare list when at runtime it is not one, so widen the search to
    // the whole file for those.
    const scope = d.viaFactory ? src : d.body;

    rows.push({
      key: keyMatch[1],
      aliases,
      file,
      viaFactory: Boolean(d.viaFactory),
      detail: /^\s*detail:\s*\{/m.test(scope),
      create: /^\s*create:\s*\{/m.test(scope),
      actions: /actions:\s*\[/.test(scope),
      summary: /^\s*summary:/m.test(scope),
      filter: /^\s*filter:\s*\{/m.test(scope),
      search: /^\s*searchFields:/m.test(scope),
      scopePicker: /^\s*scope:\s*\{/m.test(scope),
      gated: /^\s*servesRole:/m.test(scope),
    });
  }
}

const custom = [];
const map = fs.readFileSync('src/navigation/screenForModule.js', 'utf8');
const start = map.indexOf('const CUSTOM_SCREENS');
for (const m of map.slice(start, map.indexOf('};', start)).matchAll(/^\s*([A-Za-z]+):\s*(\w+),/gm)) {
  custom.push({ key: m[1], component: m[2] });
}

const thin = rows.filter((r) => !r.detail);
const readOnly = rows.filter((r) => r.detail && !r.create && !r.actions);
const full = rows.filter((r) => r.create || r.actions);

const keyCount = rows.reduce((n, r) => n + 1 + r.aliases.length, 0);

console.log(`Registry descriptors : ${rows.length}  (covering ${keyCount} nav keys)`);
console.log(`Bespoke screens      : ${custom.length}`);
console.log('');
console.log(`  list only, no detail view : ${thin.length}`);
console.log(`  list + detail, read-only  : ${readOnly.length}`);
console.log(`  can create or act         : ${full.length}`);

if (thin.length) {
  console.log('\n--- LIST ONLY (tapping a row does nothing) ---');
  thin.forEach((r) => console.log(`  ${r.key.padEnd(22)} ${r.file}`));
}

console.log('\n--- READ-ONLY (detail, but nothing can be done) ---');
readOnly.forEach((r) => console.log(`  ${r.key.padEnd(22)} ${r.file}`));

console.log('\n--- CAN ACT ---');
full.forEach((r) => {
  const what = [r.create && 'create', r.actions && 'actions'].filter(Boolean).join(' + ');
  console.log(`  ${r.key.padEnd(22)} ${what}`);
});

console.log('\n--- bespoke screens ---');
custom.forEach((c) => console.log(`  ${c.key.padEnd(22)} ${c.component}`));

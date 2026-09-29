/**
 * Checks the numbers this system hands out — registration ids, employee codes, ID and library card
 * numbers, certificate numbers, invoice numbers — are still allocated one at a time.
 *
 * Every one of them used to be worked out the same way: read the highest number already issued,
 * add one, save. Two requests that read at the same moment get the same number, and the unique
 * index then refuses the second — an admission, a card or an invoice failing for no reason the
 * person in front of it could see. So the check that matters is the concurrent one: fire many
 * allocations at once and confirm no two came back with the same number.
 *
 * Run it against a throwaway database — it writes counters and drops the database when done:
 *   npm run check:numbering
 *   E2E_MONGO_URI=mongodb://127.0.0.1:27017/whatever npm run check:numbering
 */
import mongoose from "mongoose";
import { nextSequence, highestSuffix } from "../src/utils/sequence.js";
import { formatCardNumber } from "../src/utils/generateCardNumber.js";
import { formatCertificateNumber } from "../src/utils/generateCertificateNumber.js";

const URI = process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/school_management_numbering_check";

// This drops the database it connects to. A hosted cluster is never the right target.
if (/mongodb\+srv|mongodb\.net/i.test(URI)) {
  console.error("Refusing to run against a hosted cluster — point E2E_MONGO_URI at a local mongod.");
  process.exit(1);
}

let pass = 0;
let fail = 0;
const ok = (label, cond, detail = "") => {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

await mongoose.connect(URI);
await mongoose.connection.db.dropDatabase();
console.log(`connected to ${mongoose.connection.name}\n`);

console.log("── fifty allocations fired at once ──");
const got = await Promise.all(Array.from({ length: 50 }, () => nextSequence("check:concurrent")));
ok("all fifty numbers are different", new Set(got).size === 50, `${new Set(got).size} distinct`);
ok(
  "they are one to fifty, with nothing skipped",
  JSON.stringify([...got].sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: 50 }, (_, i) => i + 1))
);

console.log("\n── starting after the numbers issued before the counter existed ──");
let seedCalls = 0;
const seed = async () => {
  seedCalls += 1;
  return 417;
};
ok("the first number carries on from the highest one already issued", (await nextSequence("check:seeded", seed)) === 418);
ok("the next follows it", (await nextSequence("check:seeded", seed)) === 419);
ok("the existing numbers are only read once", seedCalls === 1, `${seedCalls} reads`);

const raced = await Promise.all(Array.from({ length: 20 }, () => nextSequence("check:race", async () => 100)));
ok("a counter created by several requests at once still yields one sequence", new Set(raced).size === 20);
ok("and every number is past the seed", raced.every((n) => n > 100));

console.log("\n── a bulk run reserves its whole block ──");
ok("the first block starts at one", (await nextSequence("check:block", async () => 0, 10)) === 1);
ok("the next block starts after it, not inside it", (await nextSequence("check:block", async () => 0, 5)) === 11);
const [lower, upper] = (
  await Promise.all([nextSequence("check:block2", async () => 0, 30), nextSequence("check:block2", async () => 0, 30)])
).sort((a, b) => a - b);
ok("two bulk runs at once get blocks that do not overlap", upper >= lower + 30, `${lower} and ${upper}`);
ok("asking for no particular count gives one number", (await nextSequence("check:single")) === 1);

console.log("\n── reading the highest number already issued ──");
const prefix = "SID/2026/";
const only = (codes, p) => codes.filter((n) => String(n || "").startsWith(p));
ok(
  "numbers are compared as numbers, so 1000 beats 999",
  highestSuffix(only(["SID/2026/0007", "SID/2026/0999", "SID/2026/1000", null], prefix), prefix) === 1000
);
ok("another year's numbers are left out", highestSuffix(only(["SID/2025/4321"], prefix), prefix) === 0);
ok("a school with nothing issued yet starts at zero", highestSuffix([], prefix) === 0);
ok("employee codes read the same way", highestSuffix(only(["EMP0001", "EMP0042", "TCH001"], "EMP"), "EMP") === 42);
ok("invoice numbers read the same way", highestSuffix(only(["INV-000009", "INV-000010"], "INV-"), "INV-") === 10);

console.log("\n── what gets printed is unchanged ──");
ok("card number", formatCardNumber(7, { prefix: "SID", year: 2026 }) === "SID/2026/0007");
ok("a number past four digits is not cut short", formatCardNumber(12345, { prefix: "SID", year: 2026 }) === "SID/2026/12345");
ok("certificate number", formatCertificateNumber(3, { prefix: "TC", year: 2026 }) === "TC/2026/0003");
ok("library card number", formatCardNumber(1, { prefix: "LIB", year: 2026 }) === "LIB/2026/0001");

console.log("\n── one school's numbering never moves another's ──");
const at = (key) => nextSequence(key, async () => 0);
ok("each school counts on its own", (await at("idcard:AAA:Student:2026")) === 1 && (await at("idcard:BBB:Student:2026")) === 1);
ok("students and employees are numbered apart", (await at("idcard:AAA:Employee:2026")) === 1);
ok("each year starts again", (await at("idcard:AAA:Student:2025")) === 1);

await mongoose.connection.db.dropDatabase();
await mongoose.disconnect();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

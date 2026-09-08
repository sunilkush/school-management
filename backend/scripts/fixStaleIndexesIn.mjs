/**
 * Runs fixStaleIndexes.mjs against a *named* database on the cluster, with a read-only duplicate
 * check first.
 *
 *   node scripts/fixStaleIndexesIn.mjs <dbName>            report only
 *   node scripts/fixStaleIndexesIn.mjs <dbName> --apply    drop and rebuild
 *
 * Why it exists: this cluster carries more than one database, and an index fix has to be applied
 * to each of them separately. fixStaleIndexes.mjs works on whatever database MONGOOSE_URI
 * resolves to; this points it somewhere else for one run without editing .env.
 *
 * The preflight matters. Dropping a unique index is only safe if the corrected one can be built
 * again afterwards, and it cannot be if the collection already holds rows that violate it — which
 * is exactly the situation the old, wrong index was permitting. So the duplicates are counted
 * first and --apply refuses to drop anything it has just proved it cannot rebuild.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const dbName = process.argv[2];
if (!dbName || dbName.startsWith("--")) {
  console.error("Usage: node scripts/fixStaleIndexesIn.mjs <dbName> [--apply]");
  process.exit(1);
}

const base = process.env.MONGOOSE_URI;
const [before, query = ""] = base.split("?");
const withoutDb = before.replace(/\/[^/]*$/, "/");
const uri = `${withoutDb}${dbName}${query ? `?${query}` : ""}`;

/* ── read-only preflight ───────────────────────────────────── */
await mongoose.connect(uri);
const db = mongoose.connection.db;
console.log(`\n=== ${mongoose.connection.name} ===\n`);

const dupes = async (collection, field, filter) =>
  db.collection(collection).aggregate([
    { $match: filter },
    { $group: { _id: `$${field}`, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray();

const schools = await db.collection("schools").countDocuments({ deletedAt: null });
const emailDupes = await dupes("schools", "email", { deletedAt: null });
const slugDupes = await dupes("schools", "slug", { deletedAt: null, slug: { $exists: true } });
const otps = await db.collection("otps").countDocuments({});
const expired = await db.collection("otps").countDocuments({ expiresAt: { $lt: new Date() } });

console.log(`schools (not deleted): ${schools}`);
console.log(emailDupes.length
  ? `  duplicate emails: ${emailDupes.map((d) => `${d._id} x${d.n}`).join(", ")}  ← rebuild WILL fail`
  : "  no duplicate emails — the corrected unique index can be built");
console.log(slugDupes.length
  ? `  duplicate slugs: ${slugDupes.map((d) => `${JSON.stringify(d._id)} x${d.n}`).join(", ")}  ← rebuild WILL fail`
  : "  no duplicate slugs — the corrected unique index can be built");
console.log(`otps: ${otps} row(s), ${expired} past expiresAt — the TTL will delete those ${expired}`);

const blocked = emailDupes.length > 0 || slugDupes.length > 0;
await mongoose.disconnect();

if (blocked && process.argv.includes("--apply")) {
  console.error("\nRefusing to drop a unique index that cannot be rebuilt. Resolve the duplicates first.");
  process.exit(1);
}

/* ── hand over to the real script, pointed at this database ── */
console.log("");
process.env.MONGOOSE_URI = uri;
await import("./fixStaleIndexes.mjs");

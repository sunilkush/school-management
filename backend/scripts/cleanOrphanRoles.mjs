/**
 * Removes roles left behind by a school that no longer exists.
 *
 *   node backend/scripts/cleanOrphanRoles.mjs           dry run — lists, deletes nothing
 *   node backend/scripts/cleanOrphanRoles.mjs --apply   deletes
 *
 * ── What an orphan is ─────────────────────────────────────────────────────────────────────────
 *
 * A role carrying a schoolId that matches no school in the collection. deleteSchool clears a
 * school's roles as part of removing it, so these come from a school that went away some other
 * way — removed straight from the database, most likely while testing.
 *
 * They matter because the Super Admin's register form used to offer them: a role named
 * "School Admin" belonging to a school nobody can name, under a label identical to the real one.
 * That form no longer does, but the rows are still there, and any future screen listing roles
 * would show them again.
 *
 * ── What it refuses to touch ──────────────────────────────────────────────────────────────────
 *
 * Platform roles (schoolId null) are not orphans — they are the shared set every tenant uses.
 * And a role somebody actually holds is never deleted, however orphaned it looks: removing it
 * would leave that user with a roleId pointing at nothing, which is worse than the row itself.
 * Those are reported for a human to deal with.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: new URL("../.env", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
});

const apply = process.argv.includes("--apply");
const DB = "school_management";

await mongoose.connect(process.env.MONGOOSE_URI, {
  dbName: DB,
  serverSelectionTimeoutMS: 20000,
});

const db = mongoose.connection.db;
console.log(`[${apply ? "APPLY" : "DRY RUN"}] connected to ${mongoose.connection.name}\n`);

const schoolIds = new Set(
  (await db.collection("schools").find({}).project({ _id: 1 }).toArray()).map((s) => String(s._id))
);

const scoped = await db
  .collection("roles")
  .find({ schoolId: { $ne: null } })
  .project({ name: 1, schoolId: 1, createdAt: 1 })
  .toArray();

const orphans = scoped.filter((r) => !schoolIds.has(String(r.schoolId)));

if (!orphans.length) {
  console.log("No orphaned roles. Nothing to do.");
  await mongoose.disconnect();
  process.exit(0);
}

/* Checked per role rather than in aggregate: one held role must not stop the rest being cleaned,
   and it must not be swept up with them either. */
const held = [];
const free = [];
for (const role of orphans) {
  const users = await db.collection("users").countDocuments({ roleId: role._id });
  (users > 0 ? held : free).push({ ...role, users });
}

console.log(`Roles pointing at a school that no longer exists: ${orphans.length}\n`);
for (const r of free) {
  console.log(`  ${r.name.padEnd(16)} school ${r.schoolId}   held by nobody`);
}
for (const r of held) {
  console.log(`  ${r.name.padEnd(16)} school ${r.schoolId}   HELD BY ${r.users} user(s) — kept`);
}

if (held.length) {
  console.log(
    `\n${held.length} role(s) left in place because someone holds them. Move those users to a` +
      ` real role first; deleting the row would point them at nothing.`
  );
}

if (!apply) {
  console.log(`\nDry run — nothing was deleted. Re-run with --apply to remove the ${free.length} unheld role(s).`);
  await mongoose.disconnect();
  process.exit(0);
}

if (free.length) {
  const result = await db.collection("roles").deleteMany({ _id: { $in: free.map((r) => r._id) } });
  console.log(`\nDeleted ${result.deletedCount} orphaned role(s).`);
} else {
  console.log("\nNothing deleted — every orphan is held by someone.");
}

await mongoose.disconnect();

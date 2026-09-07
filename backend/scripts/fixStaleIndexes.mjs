/**
 * Drops indexes whose stored options no longer match what the model asks for, so Mongoose can
 * rebuild them correctly.
 *
 * Run: node scripts/fixStaleIndexes.mjs          # report only, changes nothing
 *      node scripts/fixStaleIndexes.mjs --apply  # actually drop and rebuild
 *
 * Why this is needed at all: Mongoose will not replace an index that already exists under the
 * same name with different options — it reports a conflict and moves on. Three indexes in this
 * codebase were declared twice (once on the field, once explicitly), so the wrong one won and
 * quietly stayed wrong:
 *
 *   schools.email_1     wanted: unique among non-deleted   had: unique across all documents
 *                       → a deleted school's email could never be reused
 *   schools.slug_1      wanted: unique among non-deleted   had: unique sparse across all
 *                       → same, for slugs
 *   otps.expiresAt_1    wanted: TTL, delete when expired   had: a plain index, no TTL
 *                       → expired OTPs were never deleted and the collection grew for ever
 *
 * The model definitions are fixed. This brings an existing database in line with them.
 *
 * Dropping a unique index leaves the data untouched — it only removes the constraint for the
 * moment it takes to rebuild. The rebuild will FAIL if the collection already holds rows that
 * violate the corrected constraint, and the script says so rather than leaving you without an
 * index: that is a real duplicate to resolve, not something to paper over.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

import { School } from "../src/models/school.model.js";
import { OTP } from "../src/models/otpVerifications.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const URI = process.env.MONGOOSE_URI;
if (!URI) {
  console.error("MONGOOSE_URI not found in .env");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

/** Indexes known to have been declared twice, and therefore possibly stored with stale options. */
const TARGETS = [
  { model: School, name: "email_1" },
  { model: School, name: "slug_1" },
  { model: OTP, name: "expiresAt_1" },
];

/** What the schema asks for now, as a comparable shape. */
const wantedSpec = (model, name) => {
  const declared = model.schema.indexes().find(([keys]) => {
    const generated = Object.entries(keys).map(([field, dir]) => `${field}_${dir}`).join("_");
    return generated === name;
  });
  if (!declared) return null;
  const [, options = {}] = declared;
  return {
    unique: Boolean(options.unique),
    partial: options.partialFilterExpression ? JSON.stringify(options.partialFilterExpression) : null,
    ttl: options.expireAfterSeconds ?? null,
  };
};

/** What the database currently has. */
const storedSpec = (index) => ({
  unique: Boolean(index.unique),
  partial: index.partialFilterExpression ? JSON.stringify(index.partialFilterExpression) : null,
  ttl: index.expireAfterSeconds ?? null,
});

const describe = (spec) =>
  [
    spec.unique ? "unique" : "not unique",
    spec.partial ? `partial ${spec.partial}` : "no partial filter",
    spec.ttl === null ? "no TTL" : `TTL ${spec.ttl}s`,
  ].join(", ");

const run = async () => {
  await mongoose.connect(URI);
  console.log(`Connected to ${mongoose.connection.name}`);
  console.log(APPLY ? "Mode: APPLY — indexes will be dropped and rebuilt\n" : "Mode: report only (pass --apply to change anything)\n");

  let stale = 0;
  const rebuild = new Set();

  for (const { model, name } of TARGETS) {
    const collection = model.collection.collectionName;
    const wanted = wantedSpec(model, name);
    if (!wanted) {
      console.log(`${collection}.${name}: no longer declared by the model — skipping`);
      continue;
    }

    let existing;
    try {
      existing = (await model.collection.indexes()).find((i) => i.name === name);
    } catch (error) {
      console.log(`${collection}.${name}: could not read indexes (${error.message})`);
      continue;
    }

    if (!existing) {
      console.log(`${collection}.${name}: missing — will be created`);
      rebuild.add(model);
      continue;
    }

    const stored = storedSpec(existing);
    const matches =
      stored.unique === wanted.unique && stored.partial === wanted.partial && stored.ttl === wanted.ttl;

    if (matches) {
      console.log(`${collection}.${name}: already correct (${describe(stored)})`);
      continue;
    }

    stale += 1;
    console.log(`${collection}.${name}: STALE`);
    console.log(`    stored: ${describe(stored)}`);
    console.log(`    wanted: ${describe(wanted)}`);

    if (APPLY) {
      await model.collection.dropIndex(name);
      console.log("    dropped");
      rebuild.add(model);
    }
  }

  if (APPLY && rebuild.size) {
    console.log("\nRebuilding...");
    for (const model of rebuild) {
      try {
        await model.init();
        console.log(`  ${model.collection.collectionName}: rebuilt`);
      } catch (error) {
        // Almost always a genuine duplicate the old, wrong index was allowing through.
        console.error(`  ${model.collection.collectionName}: REBUILD FAILED — ${error.message}`);
        console.error("    Resolve the duplicate rows above, then run this again.");
      }
    }
  }

  console.log(
    stale === 0
      ? "\nNothing stale."
      : APPLY
        ? `\n${stale} index(es) corrected.`
        : `\n${stale} index(es) need correcting. Re-run with --apply.`
  );

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

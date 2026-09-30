/**
 * Replaces the platform-wide unique index on purchaseorders.poNumber with a per-school one.
 *
 * Purchase orders are numbered per school (PO-2026-0001, PO-2026-0002, … in each school), but
 * poNumber was unique across the whole platform, so the second school to raise an order collided
 * with the first school's PO-<year>-0001 and could not create any. The model now declares
 * { schoolId, poNumber } unique instead. Mongoose creates new indexes on start-up but never drops
 * old ones, so the old `poNumber_1` index has to be removed once, by hand, on each database.
 *
 * It also reports numbers that already repeat inside one school (the per-school index cannot be
 * built while they exist).
 *
 * Dry run by default — prints what it would do:
 *   MONGOOSE_URI="<uri>" node scripts/fixPurchaseOrderNumberIndex.mjs
 * Then, to drop the old index:
 *   MONGOOSE_URI="<uri>" node scripts/fixPurchaseOrderNumberIndex.mjs --apply
 */
import mongoose from "mongoose";

const URI = process.env.MONGOOSE_URI || process.env.E2E_MONGO_URI;
if (!URI) {
  console.error("Set MONGOOSE_URI to the database to fix.");
  process.exit(1);
}
const apply = process.argv.includes("--apply");

await mongoose.connect(URI);
const collection = mongoose.connection.db.collection("purchaseorders");
console.log(`${apply ? "fixing" : "checking (dry run)"} ${mongoose.connection.name}.purchaseorders\n`);

const indexes = await collection.indexes();
const old = indexes.find((i) => i.unique && Object.keys(i.key).length === 1 && i.key.poNumber === 1);
console.log(old ? `found the platform-wide unique index "${old.name}"` : "no platform-wide poNumber index — nothing to drop");

const repeats = await collection
  .aggregate([
    { $match: { poNumber: { $type: "string" } } },
    { $group: { _id: { schoolId: "$schoolId", poNumber: "$poNumber" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ])
  .toArray();
if (repeats.length) {
  console.log(`\n${repeats.length} number(s) repeat inside one school — renumber these before the per-school index can be built:`);
  for (const r of repeats) console.log(`  school ${r._id.schoolId}  ${r._id.poNumber}  ×${r.count}`);
}

if (old && apply) {
  await collection.dropIndex(old.name);
  console.log(`\ndropped "${old.name}". The per-school index is created when the app next starts.`);
} else if (old) {
  console.log("\nrun again with --apply to drop it");
}

await mongoose.disconnect();

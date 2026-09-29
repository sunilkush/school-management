/**
 * Reports schools that have more than one live invoice for the same billing period.
 *
 * A school should be billed once per period, but until recently only the renewal job checked:
 * a Super Admin generating an invoice by hand for a period the job had already billed, or
 * pressing the button twice, produced a second one. createInvoiceForSubscription now refuses a
 * period that has already been billed, which closes that. It is a check before the write though,
 * not a guarantee — two requests in the same instant could still both pass it.
 *
 * Making it impossible needs a unique index on (schoolId, billingPeriodStart, period). That index
 * cannot be created while duplicates already exist, so run this first and clear anything it finds.
 *
 * Read-only. Safe to point at the live database:
 *   MONGOOSE_URI="<uri>" node scripts/checkDuplicateInvoices.mjs
 */
import mongoose from "mongoose";
import { SubscriptionInvoice } from "../src/models/SubscriptionInvoice.model.js";

const URI = process.env.MONGOOSE_URI || process.env.E2E_MONGO_URI;
if (!URI) {
  console.error("Set MONGOOSE_URI to the database to inspect.");
  process.exit(1);
}

await mongoose.connect(URI);
console.log(`reading ${mongoose.connection.name} — nothing is written\n`);

const groups = await SubscriptionInvoice.aggregate([
  { $match: { status: { $ne: "cancelled" } } },
  {
    $group: {
      _id: { schoolId: "$schoolId", billingPeriodStart: "$billingPeriodStart", period: "$period" },
      count: { $sum: 1 },
      invoices: { $push: { number: "$invoiceNumber", status: "$status", total: "$totalAmount" } },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $sort: { count: -1 } },
]);

const total = await SubscriptionInvoice.countDocuments();

if (!groups.length) {
  console.log(`No duplicates among ${total} invoice(s).`);
  console.log("A unique index on (schoolId, billingPeriodStart, period) would build cleanly.");
} else {
  console.log(`${groups.length} billing period(s) invoiced more than once, out of ${total} invoice(s):\n`);
  for (const g of groups) {
    const when = g._id.billingPeriodStart
      ? new Date(g._id.billingPeriodStart).toISOString().slice(0, 10)
      : "(no period start)";
    console.log(`  school ${g._id.schoolId} · from ${when} · period "${g._id.period ?? "(unset)"}" · ${g.count} invoices`);
    for (const inv of g.invoices) console.log(`      ${inv.number}  ${inv.status}  ₹${inv.total}`);
  }
  console.log("\nClear these before adding a unique index — keep the one that was paid, or the");
  console.log("earliest if none was, and cancel the rest.");
}

await mongoose.disconnect();
process.exit(groups.length ? 1 : 0);

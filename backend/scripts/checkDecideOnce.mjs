/**
 * Checks that a decision on a record happens once, however many requests arrive together.
 *
 * Approving, rejecting, cancelling, locking and paying were each written the same way: read the
 * record, check it is still in a state that allows the change, then save. Two requests that read
 * at the same moment both pass the check and both save, and the last one wins — a claim could end
 * up rejected with its manager step marked approved, a bonus approved and cancelled at once, a
 * payroll cycle paid twice over.
 *
 * Each is now a single conditional update, so the database decides the winner and the loser is
 * told. This fires the real updates against real collections and checks exactly one wins.
 *
 * Run it against a throwaway database — it drops the database when done:
 *   npm run check:decide-once
 */
import mongoose from "mongoose";
import { Reimbursement } from "../src/models/Reimbursement.model.js";
import { BonusIncentive } from "../src/models/BonusIncentive.model.js";
import { PayrollCycle } from "../src/models/PayrollCycle.model.js";
import { PayrollEntry } from "../src/models/PayrollEntry.model.js";

const URI = process.env.E2E_MONGO_URI || "mongodb://127.0.0.1:27017/school_management_decide_once_check";
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

const id = () => new mongoose.Types.ObjectId();
const schoolId = id();
const academicYearId = id();
const won = (results) => results.filter(Boolean).length;

console.log("── a reimbursement approved and rejected at the same moment ──");
{
  const claim = await Reimbursement.create({
    schoolId, academicYearId, employeeId: id(), createdBy: id(), type: "travel", amount: 500,
  });
  const [approved, rejected] = await Promise.all([
    Reimbursement.findOneAndUpdate(
      { _id: claim._id, schoolId, status: "pending_manager" },
      {
        $set: {
          status: "pending_finance",
          "approvals.$[step].status": "approved",
          "approvals.$[step].actedAt": new Date(),
        },
      },
      { new: true, arrayFilters: [{ "step.level": "manager" }] }
    ),
    Reimbursement.findOneAndUpdate(
      { _id: claim._id, schoolId, status: { $in: ["pending_manager", "pending_finance"] } },
      { $set: { status: "rejected", rejectionReason: "no" } },
      { new: true }
    ),
  ]);
  const after = await Reimbursement.findById(claim._id).lean();
  // A manager approval followed by a finance rejection is a legitimate outcome, so both calls
  // succeeding is fine. What must not happen is a decision being overwritten by one that was
  // worked out from an older reading — which is what the last save used to do.
  ok(
    "a rejection that is accepted is the state the claim is left in",
    !rejected || after.status === "rejected",
    `status=${after.status}`
  );
  ok(
    "an approval on its own leaves the claim with finance",
    Boolean(rejected) || after.status === "pending_finance",
    `status=${after.status}`
  );
  ok(
    "the claim is never left awaiting finance while carrying a rejection",
    !(after.status === "pending_finance" && after.rejectionReason),
    `status=${after.status} reason=${after.rejectionReason}`
  );
}

console.log("\n── five managers approving the same claim together ──");
{
  const claim = await Reimbursement.create({
    schoolId, academicYearId, employeeId: id(), createdBy: id(), type: "fuel", amount: 250,
  });
  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      Reimbursement.findOneAndUpdate(
        { _id: claim._id, schoolId, status: "pending_manager" },
        { $set: { status: "pending_finance" } },
        { new: true }
      )
    )
  );
  ok("exactly one is accepted, four are told no", won(results) === 1, `${won(results)} accepted`);
}

console.log("\n── a bonus approved and cancelled together ──");
{
  const bonus = await BonusIncentive.create({
    schoolId, academicYearId, employeeId: id(), createdBy: id(),
    type: "festival_bonus", title: "Diwali", amount: 5000, payoutMonth: 10, payoutYear: 2026, status: "draft",
  });
  const results = await Promise.all([
    BonusIncentive.findOneAndUpdate(
      { _id: bonus._id, schoolId, status: { $nin: ["paid", "approved"] } },
      { $set: { status: "approved" } },
      { new: true }
    ),
    BonusIncentive.findOneAndUpdate(
      { _id: bonus._id, schoolId, status: { $ne: "paid" } },
      { $set: { status: "cancelled" } },
      { new: true }
    ),
  ]);
  const after = await BonusIncentive.findById(bonus._id).lean();
  ok("the bonus ends in one state, not both", ["approved", "cancelled"].includes(after.status), after.status);
  ok("at least one caller is answered", won(results) >= 1);
}

console.log("\n── a paid bonus cannot be edited or deleted afterwards ──");
{
  const bonus = await BonusIncentive.create({
    schoolId, academicYearId, employeeId: id(), createdBy: id(),
    type: "performance_bonus", title: "Q3", amount: 9000, payoutMonth: 12, payoutYear: 2026, status: "paid",
  });
  const edited = await BonusIncentive.findOneAndUpdate(
    { _id: bonus._id, schoolId, status: { $ne: "paid" } },
    { $set: { amount: 1 } },
    { new: true }
  );
  const removed = await BonusIncentive.findOneAndDelete({ _id: bonus._id, schoolId, status: { $ne: "paid" } });
  const after = await BonusIncentive.findById(bonus._id).lean();
  ok("the edit is refused", edited === null);
  ok("the delete is refused", removed === null);
  ok("the amount that was paid is untouched", after?.amount === 9000, String(after?.amount));
}

console.log("\n── two Pay clicks on the same payroll cycle ──");
{
  const cycle = await PayrollCycle.create({
    schoolId, academicYearId, month: 9, year: 2026, status: "locked", processedBy: id(),
  });
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      PayrollCycle.findOneAndUpdate(
        { _id: cycle._id, schoolId, status: "locked" },
        { $set: { status: "paid", paidAt: new Date() } },
        { new: true }
      )
    )
  );
  ok("only one run pays the cycle", won(results) === 1, `${won(results)} runs`);
  ok("the cycle is paid once", (await PayrollCycle.findById(cycle._id).lean()).status === "paid");
}

console.log("\n── locking a cycle that is already paid ──");
{
  const cycle = await PayrollCycle.create({
    schoolId, academicYearId, month: 8, year: 2026, status: "paid", processedBy: id(),
  });
  const locked = await PayrollCycle.findOneAndUpdate(
    { _id: cycle._id, schoolId, status: { $ne: "paid" } },
    { $set: { status: "locked" } },
    { new: true }
  );
  ok("a paid cycle cannot be pulled back to locked", locked === null);
}

console.log("\n── paying the entries of a cycle ──");
{
  const cycle = await PayrollCycle.create({
    schoolId, academicYearId, month: 7, year: 2026, status: "locked", processedBy: id(),
  });
  const employees = [id(), id(), id()];
  await PayrollEntry.insertMany(
    employees.map((employeeId) => ({
      payrollCycleId: cycle._id,
      schoolId,
      employeeId,
      workingDays: 30,
      presentDays: 30,
      paidLeaves: 0,
      lopDays: 0,
      grossEarnings: 40000,
      totalDeductions: 3000,
      netPay: 37000,
    }))
  );

  // The same pipeline update payPayrollCycle runs: one statement for every pending entry,
  // with a reference built per employee.
  const prefix = `PAY-${cycle.year}${String(cycle.month).padStart(2, "0")}`;
  const markPaid = () =>
    PayrollEntry.updateMany(
      { payrollCycleId: cycle._id, paymentStatus: "pending" },
      [
        {
          $set: {
            paymentStatus: "paid",
            paymentMode: "bank",
            paidAt: new Date(),
            transactionRef: { $concat: [prefix, "-", { $toString: "$employeeId" }] },
          },
        },
      ]
    );

  const first = await markPaid();
  const second = await markPaid();
  const rows = await PayrollEntry.find({ payrollCycleId: cycle._id }).lean();

  ok("every entry is paid", rows.every((r) => r.paymentStatus === "paid"), `${rows.length} rows`);
  ok("the first run reports what it paid", first.modifiedCount === 3, String(first.modifiedCount));
  ok("a second run has nothing left to pay", second.modifiedCount === 0, String(second.modifiedCount));
  ok(
    "each entry carries its own reference",
    new Set(rows.map((r) => r.transactionRef)).size === 3 &&
      rows.every((r) => r.transactionRef === `${prefix}-${r.employeeId}`),
    rows.map((r) => r.transactionRef).join(" ")
  );
}

await mongoose.connection.db.dropDatabase();
await mongoose.disconnect();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

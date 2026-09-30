import mongoose, { Schema } from "mongoose";

/**
 * Every change to a staff member's CL / EL balance, as a signed number of days. The balance for a
 * financial year is the sum of that year's rows, so nothing carries into the next year: what is
 * left on 31 March is paid out with March's salary (kind "encashment") and April starts at zero.
 *
 *  - accrual     +1 CL / +0.5 EL each month (jobs/leaveAccrual.job.js), once per month
 *  - leave       minus the days of an approved leave, split by the year each day falls in
 *  - encashment  minus what March's payroll paid out, written when that payroll is paid
 *  - adjustment  an admin's correction or opening balance, either sign
 */
export const LEAVE_BALANCE_TYPES = ["CL", "EL"];

const leaveLedgerSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    leaveType: { type: String, enum: LEAVE_BALANCE_TYPES, required: true },
    kind: { type: String, enum: ["accrual", "leave", "encashment", "adjustment"], required: true },
    days: { type: Number, required: true },
    /** Financial year by its starting calendar year: 2026 = April 2026 – March 2027. */
    fy: { type: Number, required: true },
    /** "YYYY-MM" of the month an accrual is for. */
    period: { type: String, default: null },
    leaveRequestId: { type: Schema.Types.ObjectId, ref: "LeaveRequest", default: null },
    payrollCycleId: { type: Schema.Types.ObjectId, ref: "PayrollCycle", default: null },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

leaveLedgerSchema.index({ schoolId: 1, userId: 1, fy: 1 });
// Each of these can happen only once, however often a job or a click repeats it.
leaveLedgerSchema.index(
  { userId: 1, leaveType: 1, period: 1 },
  { unique: true, partialFilterExpression: { kind: "accrual" } }
);
leaveLedgerSchema.index(
  { leaveRequestId: 1, fy: 1 },
  { unique: true, partialFilterExpression: { kind: "leave" } }
);
leaveLedgerSchema.index(
  { payrollCycleId: 1, userId: 1, leaveType: 1 },
  { unique: true, partialFilterExpression: { kind: "encashment" } }
);

export const LeaveLedger = mongoose.model("LeaveLedger", leaveLedgerSchema);

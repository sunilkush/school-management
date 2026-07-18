import mongoose, { Schema } from "mongoose";

// Versioned by effectiveFrom so government rate changes (PF %, ESI ceiling, etc.) are
// handled by inserting a new policy document, never by editing code. A payroll cycle for
// month M always resolves the policy version whose effectiveFrom is the latest one on or
// before that cycle's date — see resolvePayrollPolicy() in payroll.controllers.js.
const payrollPolicySchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // ── EPF (Employees' Provident Fund) — Employees' Provident Funds & Miscellaneous
    // Provisions Act, 1952. Statutory wage base is Basic + DA. ──
    // School-wide on/off — the single place PF is enabled/disabled. An individual employee can
    // still be excluded (e.g. international worker, opted out at joining) via
    // Employee.statutoryCompliance.pfCategory === "excluded", but there's no separate
    // per-structure toggle any more — that was a second place to configure the same thing.
    pfEnabled: { type: Boolean, default: true },
    pfPercent: { type: Number, default: 12, min: 0 }, // employee share, deducted from pay
    pfWageCeiling: { type: Number, default: 15000, min: 0 }, // statutory PF wage ceiling (₹15,000/month)
    pfAppliedOnCeiling: { type: Boolean, default: true }, // true: PF computed on min(wage, ceiling); false: on full applicable wage (voluntary higher PF)
    // Wage-base methodology is an organization-wide policy choice (how this school computes PF
    // wage for everyone), not a per-employee attribute — lives here, not on PayrollStructure.
    pfApplicableOn: { type: String, enum: ["basic", "basicPlusDa", "custom"], default: "basicPlusDa" },
    pfCustomComponents: { type: [String], default: [] }, // used only when pfApplicableOn === "custom"
    employerPfPercent: { type: Number, default: 12, min: 0 }, // employer's total PF cost (EPS + EPF), not deducted from employee
    epsPercent: { type: Number, default: 8.33, min: 0 }, // portion of employer PF routed to EPS (Employee Pension Scheme) — always capped at pfWageCeiling by statute
    epfAdminChargesPercent: { type: Number, default: 0.5, min: 0 }, // EPF administrative charges — employer cost, on PF wage
    edliPercent: { type: Number, default: 0.5, min: 0 }, // EDLI (Employee Deposit Linked Insurance) — employer cost, on PF wage capped at ceiling

    // ── ESI (Employees' State Insurance) — ESI Act, 1948. Applies only while gross
    // wages stay within the eligibility ceiling; rates per the 2019 revision. ──
    // Same idea as pfEnabled above — school-wide on/off, with per-employee exclusion via
    // Employee.statutoryCompliance.esiCategory === "excluded" rather than a second toggle.
    esiEnabled: { type: Boolean, default: true },
    esiPercent: { type: Number, default: 0.75, min: 0 }, // employee share, deducted from pay
    esiWageCeiling: { type: Number, default: 21000, min: 0 }, // gross wages above this are not ESI-eligible
    esiApplicableOn: { type: String, enum: ["gross", "custom"], default: "gross" },
    esiCustomComponents: { type: [String], default: [] }, // used only when esiApplicableOn === "custom"
    employerEsiPercent: { type: Number, default: 3.25, min: 0 }, // employer's ESI cost, not deducted from employee

    professionalTaxAmount: { type: Number, default: 0, min: 0 },
    paidLeavePerMonth: { type: Number, default: 1, min: 0 },
    roundingMode: {
      type: String,
      enum: ["nearest", "up", "down"],
      default: "nearest",
    },
    payDateDayOfMonth: { type: Number, default: 1, min: 1, max: 28 },
    overtimeRatePerHour: { type: Number, default: 0, min: 0 },

    effectiveFrom: { type: Date, required: true, default: () => new Date("2000-01-01") },
    effectiveTo: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 300 }, // e.g. "ESI ceiling revised per 2017 notification"
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

payrollPolicySchema.index({ schoolId: 1, effectiveFrom: -1 });

export const PayrollPolicy = mongoose.model("PayrollPolicy", payrollPolicySchema);

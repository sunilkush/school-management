import mongoose, { Schema } from "mongoose";

const salarySchema = new Schema(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },

    // Fixed Components
    basicPay: { type: Number, required: true },
    hra: { type: Number, default: 0 }, // House Rent Allowance
    da: { type: Number, default: 0 },  // Dearness Allowance
    conveyance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },

    // Earnings
    overtime: {
      hours: { type: Number, default: 0 },
      ratePerHour: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    incentives: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },

    // Deductions
    pf: { type: Number, default: 0 },       // Provident Fund
    esi: { type: Number, default: 0 },      // Employee State Insurance
    professionalTax: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },      // Tax Deducted at Source
    loanRecovery: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },

    // Advances & Loans
    advances: [
      {
        amount: { type: Number },
        date: { type: Date, default: Date.now },
        reason: { type: String },
        recovered: { type: Boolean, default: false },
      },
    ],

    // Final Computed Salary
    grossSalary: { type: Number, default: 0 },   // Basic + Allowances + Earnings
    totalDeductions: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },    // Gross - Deductions

    // Payment Info
    paymentDate: { type: Date },
    paymentMethod: { type: String, enum: ["bank_transfer", "cash", "cheque"], default: "bank_transfer" },
    bankDetails: {
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },

    // Status
    status: { type: String, enum: ["pending", "processed", "paid"], default: "pending" },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Salary = mongoose.model("Salary", salarySchema);

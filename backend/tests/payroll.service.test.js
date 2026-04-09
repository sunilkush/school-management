import test from "node:test";
import assert from "node:assert/strict";
import { calculatePayrollEntry } from "../src/services/payrollCalculator.service.js";

test("calculatePayrollEntry computes lop and statutory deductions", () => {
  const result = calculatePayrollEntry({
    structure: {
      basic: 20000,
      hra: 5000,
      da: 3000,
      specialAllowance: 2000,
      grossMonthly: 30000,
      pfEnabled: true,
      esiEnabled: true,
      professionalTaxEnabled: true,
    },
    attendance: { workingDays: 30, presentDays: 26, leaveDays: 2 },
    policy: {
      pfPercent: 12,
      esiPercent: 0.75,
      professionalTaxAmount: 200,
      paidLeavePerMonth: 1,
      roundingMode: "nearest",
    },
  });

  assert.equal(result.attendance.lopDays, 3);
  assert.equal(result.grossEarnings, 30000);
  assert.equal(Math.round(result.deductionsBreakdown.lopDeduction), 3000);
  assert.equal(result.netPay > 0, true);
});

test("calculatePayrollEntry supports upward rounding", () => {
  const result = calculatePayrollEntry({
    structure: {
      basic: 10000,
      grossMonthly: 15555,
      pfEnabled: false,
      esiEnabled: false,
      professionalTaxEnabled: false,
    },
    attendance: { workingDays: 26, presentDays: 25, leaveDays: 0 },
    policy: {
      paidLeavePerMonth: 0,
      roundingMode: "up",
    },
  });

  assert.equal(Number.isInteger(result.netPay), true);
});

import mongoose, { Schema } from "mongoose";

const money = { type: Number, default: 0, min: 0 };
const objectId = (ref, required = false) => ({ type: Schema.Types.ObjectId, ref, required, index: required });

const PayrollSettingSchema = new Schema(
  {
    schoolId: objectId("School", true),
    academicYearId: objectId("AcademicYear", true),
    pfEnabled: { type: Boolean, default: false },
    esiEnabled: { type: Boolean, default: false },
    tdsEnabled: { type: Boolean, default: false },
    professionalTaxEnabled: { type: Boolean, default: false },
    currency: { type: String, default: "INR", trim: true, uppercase: true },
    salaryCalculationType: { type: String, enum: ["fixed_monthly", "attendance_based"], default: "fixed_monthly" },
    payrollApprovalRequired: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
PayrollSettingSchema.index({ schoolId: 1, academicYearId: 1 }, { unique: true });

const SalaryComponentSchema = new Schema(
  {
    schoolId: objectId("School", true),
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["earning", "deduction", "employer_contribution"], required: true, index: true },
    calculationType: { type: String, enum: ["fixed", "percentage", "formula"], default: "fixed" },
    value: money,
    formula: { type: String, trim: true, default: "" },
    taxable: { type: Boolean, default: true },
    statutory: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
SalaryComponentSchema.index({ schoolId: 1, code: 1 }, { unique: true });

const EmployeePayrollProfileSchema = new Schema(
  {
    schoolId: objectId("School", true),
    userId: objectId("User", true),
    employeeId: { type: Schema.Types.ObjectId, refPath: "employeeRefModel", required: true },
    employeeRefModel: { type: String, enum: ["Employee", "User"], default: "User" },
    roleId: { type: Schema.Types.ObjectId, ref: "Role" },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String, trim: true, default: "" },
    joiningDate: Date,
    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
    },
    statutory: {
      pfNumber: String,
      uan: String,
      esiNumber: String,
      pan: String,
      aadhaarLast4: String,
      professionalTaxNumber: String,
    },
    salaryStatus: { type: String, enum: ["active", "hold", "inactive"], default: "active", index: true },
  },
  { timestamps: true }
);
EmployeePayrollProfileSchema.index({ schoolId: 1, userId: 1 }, { unique: true });

const structureLineSchema = new Schema(
  {
    componentId: { type: Schema.Types.ObjectId, ref: "SalaryComponent" },
    name: { type: String, required: true, trim: true },
    amount: money,
    formula: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const PayrollStructureSchema = new Schema(
  {
    schoolId: objectId("School", true),
    academicYearId: objectId("AcademicYear", true),
    employeeId: objectId("User", true),
    effectiveFrom: { type: Date, required: true },
    effectiveTo: Date,
    earnings: [structureLineSchema],
    deductions: [structureLineSchema],
    grossMonthly: money,
    netMonthly: money,
    ctcMonthly: money,
    pfEnabled: { type: Boolean, default: false },
    esiEnabled: { type: Boolean, default: false },
    tdsEnabled: { type: Boolean, default: false },
    professionalTaxEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
PayrollStructureSchema.index({ schoolId: 1, academicYearId: 1, employeeId: 1, status: 1 });

const PayrollCycleSchema = new Schema(
  {
    schoolId: objectId("School", true),
    academicYearId: objectId("AcademicYear", true),
    name: { type: String, trim: true },
    month: { type: Number, min: 1, max: 12, required: true },
    year: { type: Number, required: true },
    startDate: Date,
    endDate: Date,
    payDate: Date,
    status: { type: String, enum: ["draft", "processing", "pending_approval", "approved", "paid", "locked"], default: "draft", index: true },
    totalEmployees: { type: Number, default: 0 },
    grossAmount: money,
    deductionAmount: money,
    netPayable: money,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    lockedAt: Date,
  },
  { timestamps: true }
);
PayrollCycleSchema.index({ schoolId: 1, academicYearId: 1, month: 1, year: 1 }, { unique: true });

const amountLineSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    componentId: { type: Schema.Types.ObjectId, ref: "SalaryComponent" },
    amount: money,
  },
  { _id: false }
);

const PayrollRunItemSchema = new Schema(
  {
    schoolId: objectId("School", true),
    academicYearId: objectId("AcademicYear", true),
    payrollCycleId: objectId("PayrollCycle", true),
    employeeId: objectId("User", true),
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    attendanceSummary: {
      workingDays: { type: Number, default: 0 },
      presentDays: { type: Number, default: 0 },
      paidLeaves: { type: Number, default: 0 },
      unpaidLeaves: { type: Number, default: 0 },
      absentDays: { type: Number, default: 0 },
      overtimeHours: { type: Number, default: 0 },
    },
    earnings: [amountLineSchema],
    deductions: [amountLineSchema],
    employerContributions: [amountLineSchema],
    grossSalary: money,
    totalDeductions: money,
    netSalary: money,
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "hold"], default: "pending", index: true },
    payslipUrl: String,
    remarks: String,
  },
  { timestamps: true }
);
PayrollRunItemSchema.index({ payrollCycleId: 1, employeeId: 1 }, { unique: true });
PayrollRunItemSchema.index({ schoolId: 1, academicYearId: 1, employeeId: 1 });

const PayrollAdjustmentSchema = new Schema(
  {
    schoolId: objectId("School", true),
    employeeId: objectId("User", true),
    payrollCycleId: objectId("PayrollCycle", true),
    type: { type: String, enum: ["earning", "deduction"], required: true },
    title: { type: String, required: true, trim: true },
    amount: money,
    reason: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
PayrollAdjustmentSchema.index({ schoolId: 1, payrollCycleId: 1, employeeId: 1 });

const EmployeeLoanSchema = new Schema(
  {
    schoolId: objectId("School", true),
    employeeId: objectId("User", true),
    principalAmount: money,
    monthlyDeduction: money,
    remainingAmount: money,
    startMonth: Date,
    status: { type: String, enum: ["active", "closed", "defaulted"], default: "active", index: true },
  },
  { timestamps: true }
);
EmployeeLoanSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

const ReimbursementSchema = new Schema(
  {
    schoolId: objectId("School", true),
    employeeId: objectId("User", true),
    title: { type: String, required: true, trim: true },
    amount: money,
    billUrl: String,
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending", index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
ReimbursementSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

export const PayrollSetting = mongoose.model("PayrollSetting", PayrollSettingSchema);
export const SalaryComponent = mongoose.model("SalaryComponent", SalaryComponentSchema);
export const EmployeePayrollProfile = mongoose.model("EmployeePayrollProfile", EmployeePayrollProfileSchema);
export const PayrollStructure = mongoose.model("PayrollStructure", PayrollStructureSchema);
export const PayrollCycle = mongoose.model("PayrollCycle", PayrollCycleSchema);
export const PayrollRunItem = mongoose.model("PayrollRunItem", PayrollRunItemSchema);
export const PayrollAdjustment = mongoose.model("PayrollAdjustment", PayrollAdjustmentSchema);
export const EmployeeLoan = mongoose.model("EmployeeLoan", EmployeeLoanSchema);
export const Reimbursement = mongoose.model("Reimbursement", ReimbursementSchema);

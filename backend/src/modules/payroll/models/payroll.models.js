import mongoose, { Schema } from "mongoose";

const { ObjectId } = Schema.Types;

const auditFields = {
  schoolId: { type: ObjectId, ref: "School", required: true, index: true },
  academicYearId: { type: ObjectId, ref: "AcademicYear", index: true },
  createdBy: { type: ObjectId, ref: "User" },
  updatedBy: { type: ObjectId, ref: "User" },
  status: { type: String, default: "active", index: true },
};

const amountLineSchema = new Schema(
  {
    componentId: { type: ObjectId, ref: "SalaryComponent" },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    type: { type: String, enum: ["earning", "deduction", "employer_contribution"], required: true },
    calculationType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    percentageOf: { type: String, trim: true, default: "gross" },
    value: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0 },
    taxable: { type: Boolean, default: true },
    pfApplicable: { type: Boolean, default: false },
    esiApplicable: { type: Boolean, default: false },
  },
  { _id: false }
);

const approvalSchema = new Schema(
  {
    action: { type: String, trim: true },
    status: { type: String, trim: true },
    comment: { type: String, trim: true },
    performedBy: { type: ObjectId, ref: "User" },
    role: { type: String, trim: true },
    performedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const payrollSettingSchema = new Schema(
  {
    ...auditFields,
    payrollEnabled: { type: Boolean, default: true },
    salaryFrequency: { type: String, enum: ["monthly", "weekly", "biweekly"], default: "monthly" },
    defaultPayDay: { type: Number, min: 1, max: 31, default: 30 },
    workingDaysMethod: { type: String, enum: ["calendar_days", "fixed_days", "attendance_days"], default: "attendance_days" },
    includeWeekOff: { type: Boolean, default: true },
    includeHolidays: { type: Boolean, default: true },
    currency: { type: String, default: "INR", uppercase: true },
    pf: { enabled: { type: Boolean, default: false }, wageCeiling: { type: Number, default: 15000 }, employeeRate: { type: Number, default: 12 }, employerRate: { type: Number, default: 12 } },
    esi: { enabled: { type: Boolean, default: false }, wageCeiling: { type: Number, default: 21000 }, employeeRate: { type: Number, default: 0.75 }, employerRate: { type: Number, default: 3.25 } },
    tds: { enabled: { type: Boolean, default: false }, defaultRate: { type: Number, default: 0 } },
    professionalTax: { enabled: { type: Boolean, default: false }, monthlyAmount: { type: Number, default: 0 } },
    roundingMethod: { type: String, enum: ["none", "nearest", "ceil", "floor"], default: "nearest" },
  },
  { timestamps: true }
);
payrollSettingSchema.index({ schoolId: 1, academicYearId: 1 }, { unique: true, sparse: true });

const salaryComponentSchema = new Schema(
  {
    ...auditFields,
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    type: { type: String, enum: ["earning", "deduction", "employer_contribution"], required: true, index: true },
    calculationType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
    percentageOf: { type: String, trim: true, default: "gross" },
    value: { type: Number, default: 0, min: 0 },
    taxable: { type: Boolean, default: true },
    pfApplicable: { type: Boolean, default: false },
    esiApplicable: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);
salaryComponentSchema.index({ schoolId: 1, code: 1 }, { unique: true });

const employeeSalaryStructureSchema = new Schema(
  {
    ...auditFields,
    employeeId: { type: ObjectId, ref: "Employee", required: true, index: true },
    effectiveFrom: { type: Date, required: true, index: true },
    effectiveTo: { type: Date },
    earnings: { type: [amountLineSchema], default: [] },
    deductions: { type: [amountLineSchema], default: [] },
    employerContributions: { type: [amountLineSchema], default: [] },
    statutoryFlags: { pfEnabled: Boolean, esiEnabled: Boolean, tdsEnabled: Boolean, professionalTaxEnabled: Boolean },
    grossMonthly: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    employerContribution: { type: Number, default: 0 },
    netMonthly: { type: Number, default: 0 },
    ctcMonthly: { type: Number, default: 0 },
    ctcYearly: { type: Number, default: 0 },
    remarks: { type: String, trim: true },
    approvedBy: { type: ObjectId, ref: "User" },
    approvedAt: Date,
    approvalTrail: { type: [approvalSchema], default: [] },
  },
  { timestamps: true }
);
employeeSalaryStructureSchema.index({ schoolId: 1, academicYearId: 1, employeeId: 1, effectiveFrom: -1 });

const payrollCycleSchema = new Schema(
  {
    ...auditFields,
    cycleName: { type: String, required: true, trim: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paymentDate: { type: Date },
    totalEmployees: { type: Number, default: 0 },
    grossPay: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    employerContribution: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    lockedAt: Date,
    lockedBy: { type: ObjectId, ref: "User" },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);
payrollCycleSchema.index({ schoolId: 1, academicYearId: 1, month: 1, year: 1 }, { unique: true });

const payrollRunSchema = new Schema(
  {
    ...auditFields,
    cycleId: { type: ObjectId, ref: "PayrollCycle", required: true, index: true },
    runNumber: { type: String, trim: true },
    totals: { totalEmployees: Number, grossPay: Number, deductions: Number, employerContribution: Number, netPay: Number, pf: Number, esi: Number, tds: Number, professionalTax: Number },
    submittedAt: Date,
    approvedBy: { type: ObjectId, ref: "User" },
    approvedAt: Date,
    paidBy: { type: ObjectId, ref: "User" },
    paidAt: Date,
    approvalTrail: { type: [approvalSchema], default: [] },
  },
  { timestamps: true }
);
payrollRunSchema.index({ schoolId: 1, academicYearId: 1, cycleId: 1 }, { unique: true });

const payrollRunItemSchema = new Schema(
  {
    ...auditFields,
    cycleId: { type: ObjectId, ref: "PayrollCycle", required: true, index: true },
    payrollRunId: { type: ObjectId, ref: "PayrollRun", required: true, index: true },
    employeeId: { type: ObjectId, ref: "Employee", required: true, index: true },
    employeeSnapshot: { type: Schema.Types.Mixed, default: {} },
    attendanceSummary: { workingDays: Number, presentDays: Number, paidLeaves: Number, unpaidLeaves: Number, payableDays: Number },
    earnings: { type: [amountLineSchema], default: [] },
    deductions: { type: [amountLineSchema], default: [] },
    employerContributions: { type: [amountLineSchema], default: [] },
    loanDeduction: { type: Number, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    manualAdjustment: { amount: { type: Number, default: 0 }, reason: String },
    grossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    employerContribution: { type: Number, default: 0 },
    netPay: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["pending", "hold", "paid", "failed"], default: "pending", index: true },
    auditTrail: { type: [approvalSchema], default: [] },
  },
  { timestamps: true }
);
payrollRunItemSchema.index({ schoolId: 1, cycleId: 1, employeeId: 1 }, { unique: true });

const payslipSchema = new Schema(
  {
    ...auditFields,
    cycleId: { type: ObjectId, ref: "PayrollCycle", required: true, index: true },
    payrollRunItemId: { type: ObjectId, ref: "PayrollRunItem", required: true, index: true },
    employeeId: { type: ObjectId, ref: "Employee", required: true, index: true },
    payslipNumber: { type: String, required: true, trim: true, index: true },
    month: Number,
    year: Number,
    grossPay: Number,
    deductions: Number,
    employerContribution: Number,
    netPay: Number,
    payload: { type: Schema.Types.Mixed, default: {} },
    publishedAt: Date,
    publishedBy: { type: ObjectId, ref: "User" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  },
  { timestamps: true }
);
payslipSchema.index({ schoolId: 1, cycleId: 1, employeeId: 1 }, { unique: true });

const payrollAdjustmentSchema = new Schema({ ...auditFields, employeeId: { type: ObjectId, ref: "Employee", required: true, index: true }, cycleId: { type: ObjectId, ref: "PayrollCycle", index: true }, type: { type: String, enum: ["bonus", "arrear", "deduction", "reimbursement"], required: true }, amount: { type: Number, required: true }, payrollMonth: Date, reason: String, attachment: String, taxable: { type: Boolean, default: true } }, { timestamps: true });
payrollAdjustmentSchema.index({ schoolId: 1, academicYearId: 1, employeeId: 1, cycleId: 1 });

const employeeLoanSchema = new Schema({ ...auditFields, employeeId: { type: ObjectId, ref: "Employee", required: true, index: true }, loanType: { type: String, required: true }, principalAmount: { type: Number, required: true }, approvedAmount: Number, emiAmount: Number, totalInstallments: Number, paidInstallments: { type: Number, default: 0 }, balance: Number, startMonth: Date, reason: String, attachment: String, approvedBy: { type: ObjectId, ref: "User" }, approvedAt: Date }, { timestamps: true });
employeeLoanSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

const taxDeclarationSchema = new Schema({ ...auditFields, employeeId: { type: ObjectId, ref: "Employee", required: true, index: true }, financialYear: { type: String, required: true }, taxRegime: { type: String, enum: ["old", "new"], default: "new" }, pan: String, estimatedIncome: Number, declarations: { type: [Schema.Types.Mixed], default: [] }, proofs: { type: [Schema.Types.Mixed], default: [] }, submittedAt: Date, reviewedBy: { type: ObjectId, ref: "User" }, reviewedAt: Date }, { timestamps: true });
taxDeclarationSchema.index({ schoolId: 1, employeeId: 1, financialYear: 1 }, { unique: true });

const payrollComplianceSchema = new Schema({ ...auditFields, cycleId: { type: ObjectId, ref: "PayrollCycle", index: true }, type: { type: String, enum: ["pf", "esi", "tds", "professional_tax"], required: true }, amount: { type: Number, default: 0 }, dueDate: Date, filedAt: Date, referenceNumber: String, payload: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true });
payrollComplianceSchema.index({ schoolId: 1, academicYearId: 1, cycleId: 1, type: 1 });

const payrollAuditLogSchema = new Schema({ schoolId: { type: ObjectId, ref: "School", required: true, index: true }, academicYearId: { type: ObjectId, ref: "AcademicYear", index: true }, action: { type: String, required: true, index: true }, entity: { type: String, required: true, index: true }, entityId: { type: ObjectId, index: true }, employeeId: { type: ObjectId, ref: "Employee" }, performedBy: { type: ObjectId, ref: "User" }, role: String, ipAddress: String, remarks: String, before: Schema.Types.Mixed, after: Schema.Types.Mixed, status: { type: String, default: "success", index: true }, createdBy: { type: ObjectId, ref: "User" }, updatedBy: { type: ObjectId, ref: "User" } }, { timestamps: true });
payrollAuditLogSchema.index({ schoolId: 1, createdAt: -1 });

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);

export const PayrollSetting = model("PayrollSetting", payrollSettingSchema);
export const SalaryComponent = model("SalaryComponent", salaryComponentSchema);
export const EmployeeSalaryStructure = model("EmployeeSalaryStructure", employeeSalaryStructureSchema);
export const PayrollCycle = model("PayrollCycle", payrollCycleSchema);
export const PayrollRun = model("PayrollRun", payrollRunSchema);
export const PayrollRunItem = model("PayrollRunItem", payrollRunItemSchema);
export const Payslip = model("Payslip", payslipSchema);
export const PayrollAdjustment = model("PayrollAdjustment", payrollAdjustmentSchema);
export const EmployeeLoan = model("EmployeeLoan", employeeLoanSchema);
export const TaxDeclaration = model("TaxDeclaration", taxDeclarationSchema);
export const PayrollCompliance = model("PayrollCompliance", payrollComplianceSchema);
export const PayrollAuditLog = model("PayrollAuditLog", payrollAuditLogSchema);

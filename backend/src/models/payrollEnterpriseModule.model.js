import mongoose, { Schema } from 'mongoose'

const amountLineSchema = new Schema(
    {
        componentId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollComponent',
            default: null,
        },
        name: { type: String, required: true, trim: true },
        code: { type: String, trim: true, uppercase: true },
        type: {
            type: String,
            enum: ['earning', 'deduction', 'employer_contribution'],
            required: true,
        },
        calculationType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed',
        },
        amount: { type: Number, default: 0, min: 0 },
        percentageOf: { type: String, trim: true, default: 'gross' },
        isStatutory: { type: Boolean, default: false },
    },
    { _id: false }
)

const payrollComponentSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            default: null,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, trim: true, uppercase: true },
        type: {
            type: String,
            enum: ['earning', 'deduction', 'employer_contribution'],
            required: true,
            index: true,
        },
        calculationType: {
            type: String,
            enum: ['fixed', 'percentage'],
            default: 'fixed',
        },
        defaultAmount: { type: Number, default: 0, min: 0 },
        percentageOf: { type: String, trim: true, default: 'gross' },
        isStatutory: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)
payrollComponentSchema.index(
    { schoolId: 1, academicYearId: 1, code: 1 },
    { unique: true }
)

const salaryTemplateSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        department: { type: String, trim: true, default: '' },
        role: { type: String, trim: true, default: '' },
        designation: { type: String, trim: true, default: '' },
        earnings: { type: [amountLineSchema], default: [] },
        deductions: { type: [amountLineSchema], default: [] },
        employerContributions: { type: [amountLineSchema], default: [] },
        grossSalary: { type: Number, default: 0, min: 0 },
        totalDeductions: { type: Number, default: 0, min: 0 },
        ctc: { type: Number, default: 0, min: 0 },
        isActive: { type: Boolean, default: true, index: true },
        clonedFrom: {
            type: Schema.Types.ObjectId,
            ref: 'SalaryTemplate',
            default: null,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)
salaryTemplateSchema.index(
    { schoolId: 1, academicYearId: 1, name: 1 },
    { unique: true }
)

const employeeSalaryStructureSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        templateId: {
            type: Schema.Types.ObjectId,
            ref: 'SalaryTemplate',
            default: null,
        },
        earnings: { type: [amountLineSchema], default: [] },
        deductions: { type: [amountLineSchema], default: [] },
        employerContributions: { type: [amountLineSchema], default: [] },
        grossSalary: { type: Number, default: 0, min: 0 },
        totalDeductions: { type: Number, default: 0, min: 0 },
        netSalary: { type: Number, default: 0 },
        ctc: { type: Number, default: 0, min: 0 },
        effectiveFrom: { type: Date, required: true, index: true },
        effectiveTo: { type: Date, default: null, index: true },
        status: {
            type: String,
            enum: ['active', 'inactive', 'draft', 'archived'],
            default: 'active',
            index: true,
        },
        revisionReason: { type: String, trim: true, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)
employeeSalaryStructureSchema.index({ schoolId: 1, academicYearId: 1 })
employeeSalaryStructureSchema.index({
    employeeId: 1,
    effectiveFrom: -1,
    effectiveTo: 1,
})
employeeSalaryStructureSchema.index(
    { schoolId: 1, employeeId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'active', effectiveTo: null },
    }
)

const employeePayrollSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        payrollCycleId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollCycle',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        salaryStructureId: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeeSalaryStructure',
            required: true,
        },
        attendance: { type: Schema.Types.Mixed, default: {} },
        earnings: { type: [amountLineSchema], default: [] },
        deductions: { type: [amountLineSchema], default: [] },
        employerContributions: { type: [amountLineSchema], default: [] },
        grossEarnings: { type: Number, default: 0, min: 0 },
        totalDeductions: { type: Number, default: 0, min: 0 },
        netPayable: { type: Number, default: 0 },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'processing', 'paid', 'failed'],
            default: 'unpaid',
            index: true,
        },
        skippedReason: { type: String, trim: true, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)
employeePayrollSchema.index({ schoolId: 1, academicYearId: 1 })
employeePayrollSchema.index(
    { employeeId: 1, payrollCycleId: 1 },
    { unique: true }
)

const payrollApprovalSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        payrollCycleId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollCycle',
            required: true,
            index: true,
        },
        action: {
            type: String,
            enum: ['submitted', 'approved', 'rejected'],
            required: true,
        },
        fromStatus: { type: String, trim: true, default: '' },
        toStatus: { type: String, trim: true, default: '' },
        remarks: { type: String, trim: true, default: '' },
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actorRole: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
)
payrollApprovalSchema.index({ schoolId: 1, academicYearId: 1 })

const salaryPaymentSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        payrollCycleId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollCycle',
            required: true,
            index: true,
        },
        employeePayrollId: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeePayroll',
            required: true,
            unique: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        amount: { type: Number, required: true, min: 0 },
        mode: {
            type: String,
            enum: ['bank', 'cash', 'cheque', 'UPI'],
            required: true,
        },
        transactionRef: { type: String, trim: true, default: '' },
        paymentDate: { type: Date, default: Date.now },
        proofUrl: { type: String, trim: true, default: '' },
        status: {
            type: String,
            enum: ['unpaid', 'processing', 'paid', 'failed'],
            default: 'paid',
            index: true,
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)
salaryPaymentSchema.index({ schoolId: 1, academicYearId: 1 })

const loanInstallmentSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        loanId: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeeLoan',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        payrollCycleId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollCycle',
            default: null,
        },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true, min: 0 },
        paidAmount: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'deducted', 'paid', 'skipped'],
            default: 'pending',
            index: true,
        },
    },
    { timestamps: true }
)

const employeeLoanSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        type: { type: String, enum: ['loan', 'advance'], default: 'loan' },
        amount: { type: Number, required: true, min: 1 },
        emiAmount: { type: Number, required: true, min: 1 },
        remainingBalance: { type: Number, required: true, min: 0 },
        startDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'active', 'closed'],
            default: 'pending',
            index: true,
        },
        approvalRemarks: { type: String, trim: true, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        closedAt: { type: Date, default: null },
    },
    { timestamps: true }
)
employeeLoanSchema.index({ schoolId: 1, academicYearId: 1 })

const taxDeclarationSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        academicYearId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademicYear',
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        regime: { type: String, enum: ['old', 'new'], default: 'new' },
        declarations: { type: [Schema.Types.Mixed], default: [] },
        status: {
            type: String,
            enum: ['draft', 'submitted', 'approved', 'rejected'],
            default: 'draft',
        },
        submittedAt: { type: Date, default: null },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
)
taxDeclarationSchema.index({ schoolId: 1, academicYearId: 1 })
taxDeclarationSchema.index(
    { employeeId: 1, academicYearId: 1 },
    { unique: true }
)

export const PayrollComponent =
    mongoose.models.PayrollComponent ||
    mongoose.model('PayrollComponent', payrollComponentSchema)
export const SalaryTemplate =
    mongoose.models.SalaryTemplate ||
    mongoose.model('SalaryTemplate', salaryTemplateSchema)
export const EmployeeSalaryStructure =
    mongoose.models.EmployeeSalaryStructure ||
    mongoose.model('EmployeeSalaryStructure', employeeSalaryStructureSchema)
export const EmployeePayroll =
    mongoose.models.EmployeePayroll ||
    mongoose.model('EmployeePayroll', employeePayrollSchema)
export const PayrollApproval =
    mongoose.models.PayrollApproval ||
    mongoose.model('PayrollApproval', payrollApprovalSchema)
export const SalaryPayment =
    mongoose.models.SalaryPayment ||
    mongoose.model('SalaryPayment', salaryPaymentSchema)
export const EmployeeLoan =
    mongoose.models.EmployeeLoan ||
    mongoose.model('EmployeeLoan', employeeLoanSchema)
export const LoanInstallment =
    mongoose.models.LoanInstallment ||
    mongoose.model('LoanInstallment', loanInstallmentSchema)
export const TaxDeclaration =
    mongoose.models.TaxDeclaration ||
    mongoose.model('TaxDeclaration', taxDeclarationSchema)

import mongoose, { Schema } from 'mongoose'

const payslipSchema = new Schema(
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
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        payrollRunId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollRun',
            default: null,
            index: true,
        },
        payrollItemId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollItem',
            default: null,
            unique: true,
            sparse: true,
        },
        payrollCycleId: {
            type: Schema.Types.ObjectId,
            ref: 'PayrollCycle',
            default: null,
            index: true,
        },
        employeePayrollId: {
            type: Schema.Types.ObjectId,
            ref: 'EmployeePayroll',
            default: null,
            unique: true,
            sparse: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        payslipNumber: { type: String, trim: true, default: '', index: true },
        month: { type: Number, min: 1, max: 12 },
        year: { type: Number },
        schoolSnapshot: { type: Schema.Types.Mixed, default: {} },
        employeeSnapshot: { type: Schema.Types.Mixed, default: {} },
        earnings: { type: [Schema.Types.Mixed], default: [] },
        deductions: { type: [Schema.Types.Mixed], default: [] },
        grossEarnings: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
        netPayable: { type: Number, default: 0 },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'processing', 'paid', 'failed'],
            default: 'unpaid',
        },
        pdfUrl: { type: String, default: null },
        emailStatus: {
            type: String,
            enum: ['pending', 'sent', 'failed'],
            default: 'pending',
        },
        emailedAt: { type: Date, default: null },
        emailFailureReason: { type: String, default: null },
    },
    { timestamps: true }
)

payslipSchema.index({ schoolId: 1, academicYearId: 1 })
payslipSchema.index(
    { schoolId: 1, employeeId: 1, month: 1, year: 1 },
    { unique: true, sparse: true }
)

export const Payslip =
    mongoose.models.Payslip || mongoose.model('Payslip', payslipSchema)

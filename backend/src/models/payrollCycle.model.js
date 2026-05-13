import mongoose, { Schema } from 'mongoose'

const payrollCycleSchema = new Schema(
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
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true, min: 2000 },
        status: {
            type: String,
            enum: [
                'draft',
                'processing',
                'pending_approval',
                'approved',
                'paid',
                'locked',
                'rejected',
            ],
            default: 'draft',
            index: true,
        },
        totalEmployees: { type: Number, default: 0, min: 0 },
        totalGross: { type: Number, default: 0, min: 0 },
        totalDeductions: { type: Number, default: 0, min: 0 },
        totalNetPayable: { type: Number, default: 0 },
        skippedEmployees: { type: [Schema.Types.Mixed], default: [] },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        submittedAt: { type: Date, default: null },
        approvedAt: { type: Date, default: null },
        lockedAt: { type: Date, default: null },
        paidAt: { type: Date, default: null },
    },
    { timestamps: true }
)

payrollCycleSchema.index({ schoolId: 1, academicYearId: 1 })
payrollCycleSchema.index(
    { schoolId: 1, academicYearId: 1, month: 1, year: 1 },
    {
        unique: true,
        partialFilterExpression: { academicYearId: { $type: 'objectId' } },
    }
)
payrollCycleSchema.index({ schoolId: 1, month: 1, year: 1 })

export const PayrollCycle =
    mongoose.models.PayrollCycle ||
    mongoose.model('PayrollCycle', payrollCycleSchema)

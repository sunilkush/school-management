import mongoose, { Schema } from 'mongoose'

const historySchema = new Schema(
    {
        action: {
            type: String,
            enum: ['created', 'approved', 'rejected', 'emi_deducted', 'closed'],
            required: true,
        },
        amount: { type: Number, default: 0 },
        note: { type: String, trim: true },
        actedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        actedAt: { type: Date, default: Date.now },
    },
    { _id: false }
)

const loanAdvanceSchema = new Schema(
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
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
            index: true,
        },
        totalAmount: { type: Number, required: true, min: 1 },
        remainingAmount: { type: Number, required: true, min: 0 },
        emiAmount: { type: Number, required: true, min: 1 },
        startMonth: { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'active', 'rejected', 'closed'],
            default: 'pending',
            index: true,
        },
        rejectionReason: { type: String, default: null },
        history: { type: [historySchema], default: [] },
    },
    { timestamps: true }
)

loanAdvanceSchema.index({ schoolId: 1, employeeId: 1, status: 1 })

export const LoanAdvance = mongoose.model('LoanAdvance', loanAdvanceSchema)

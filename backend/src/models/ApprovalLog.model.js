import mongoose, { Schema } from 'mongoose'

const approvalLogSchema = new Schema(
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
            required: true,
            index: true,
        },
        level: {
            type: String,
            enum: ['hr', 'accountant', 'principal', 'management', 'admin'],
            required: true,
        },
        action: {
            type: String,
            enum: ['approved', 'rejected', 'locked', 'unlocked', 'paid', 'rolled_back'],
            required: true,
        },
        comment: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
)

export const ApprovalLog = mongoose.model('ApprovalLog', approvalLogSchema)

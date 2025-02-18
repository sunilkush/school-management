import mongoose, { Schema } from "mongoose";

const PayrollSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        salaryAmount: {
            type: Number,
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['paid', 'pending'],
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Payroll = mongoose.model("Payroll", PayrollSchema)

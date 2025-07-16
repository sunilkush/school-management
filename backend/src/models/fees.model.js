import mongoose, { Schema } from "mongoose";

const FeesSchema = new Schema(
    {   
        academicYearId:{
                type:Schema.Types.ObjectId,
                ref: "AcademicYears",
                required: true
            },
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['Razorpay', 'Stripe', 'PayPal'],
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['paid', 'pending'],
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Fees = mongoose.model("Fees", FeesSchema)

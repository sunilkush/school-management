import mongoose, { Schema } from "mongoose";

const feesSchema = new Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    totalFee: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["paid", "partial", "unpaid"],
        default: "unpaid"
    },
}, { timestamps: true });

export const Fee = mongoose.model("Fees", feesSchema)
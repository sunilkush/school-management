import mongoose, { Schema } from "mongoose";

const admissionSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
    },
    classApplied: {
        type: String,
        required: true
    },
    admissionDate: {
        type: Date,
        default: new Date(),
        required: true,
    },
    status: {
        type: String,
        enum: ["Approved", "Pending", "Rejected"],
        default: "pending"
    }
}, { timestamps: true })

export const Admission = mongoose.model("Admissions", admissionSchema)
import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ["Present", "Absent", "Late", "Excused"],
        required: true
    },
    remarks: {
        type: string
    }

})

export const Attendance = mongoose.model("Attendance", attendanceSchema)
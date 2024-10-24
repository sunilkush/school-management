import mongoose, { Schema } from "mongoose";

const examSchema = new Schema({
    examName: {
        type: String,
        required: true
    },
    subjectId: {
        type: Schema.Types.ObjectId,
        ref: "Class.subjects",
        required: true
    },
    classId: {
        type: Schema.Types.ObjectId,
        ref: "Class",
        required: true
    },
    date: {
        type: Date,
        required: true,
    },
    totalMasks: {
        type: String,
        required: True
    },
    StudentResults: [{
        studentId: {
            type: Schema.Types.ObjectId,
            ref: "Student"
        },
        markObtained: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true })

export const Exam = mongoose.model("Exams", examSchema)
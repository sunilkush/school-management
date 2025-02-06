import mongoose, { Schema } from "mongoose";
const GradeSchema = new Schema(
    {
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User', required: true
        },
        examId: {
            type: Schema.Types.ObjectId,
            ref: 'Exam',
            required: true
        },
        marksObtained: {
            type: Number,
            required: true
        },
        grade: {
            type: String,
            required: true
        },
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
    },
    { timestamps: true }
);

export const Grade = mongoose.model("Grade", GradeSchema)
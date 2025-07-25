import mongoose, { Schema } from "mongoose";


const ExamSchema = new Schema(
    {   academicYearId:{
            type: Schema.Types.ObjectId,
            ref: "AcademicYears",
            required: true
        },
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        classId: {
            type: Schema.Types.ObjectId,
            ref: 'Classes',
            required: true,
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        examType: {
            type: String,
            enum: ['Midterm', 'Final', 'Quiz'],
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

export const Exam = mongoose.model("Exam", ExamSchema)
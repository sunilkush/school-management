import mongoose, { Schema } from "mongoose";
const AssignmentSchema = new Schema(
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
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        attachments: [
            { type: String }
        ],
    },
    { timestamps: true }
);

export const Assignment = mongoose.model("Assignment", AssignmentSchema)
import mongoose, { Schema } from "mongoose";
const AssignmentSchema = new Schema(
    {   
          academicYearId:{
                type:Schema.Types.ObjectId,
                 ref: "AcademicYear",
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
         schoolClassId: { type: Schema.Types.ObjectId,
             ref: "SchoolClass" ,
            required: true,
        },
        sectionId: {
            type: Schema.Types.ObjectId,
            ref: "Section",
            required: false,
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        title: {
            type: String,
            required: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: true,
            lowercase: true
        },
        dueDate: {
            type: Date,
            required: true,
        },
        attachments: [
            { type: String }
        ],
        status: {
            type: String,
            enum: ["draft", "assigned", "closed"],
            default: "assigned",
            index: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

AssignmentSchema.index({ schoolId: 1, academicYearId: 1, schoolClassId: 1, sectionId: 1, subjectId: 1, dueDate: 1 });

export const Assignment = mongoose.model("Assignment", AssignmentSchema)
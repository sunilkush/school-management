import mongoose, { Schema } from "mongoose";

const classSchema = new Schema({
    academicYearId:{
        type:Schema.Types.ObjectId,
        ref: "AcademicYears",
        required: true
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "Schools",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    section: {
        type: String,
        required: true,
        enum: ["A", "B", "C", "D"], 
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: "Users"
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: "Users"
        }
    ],
    subjects: [
        {
            type: Schema.Types.ObjectId,
            ref: "Subjects"
        }
    ]
},
    {
        timestamps: true
    })

export const Classes = mongoose.model("Classes", classSchema)

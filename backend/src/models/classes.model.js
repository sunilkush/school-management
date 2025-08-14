import mongoose, { Schema } from "mongoose";

const classSchema = new Schema({
   
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School",
        required: true,
    },
    name: {
        type: String,
        required: true,
        lowercase: true
    },
    section: {
        type: String,
        required: true,
        enum: ["A", "B", "C", "D"], 
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    subjects: [
        {
            type: Schema.Types.ObjectId,
            ref: "Subject",
            lowercase: true
        }
    ]
},
    {
        timestamps: true
    })

export const Classes = mongoose.model("Classes", classSchema)

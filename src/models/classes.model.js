import mongoose, { Schema } from "mongoose";

const classSchema = new Schema({
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School"
    },
    name: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
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
            ref: "Subject"
        }
    ]
},
    {
        timestamps: true
    })

export const Classes = mongoose.model("Classes", classSchema)

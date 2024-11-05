import mongoose, { Schema } from "mongoose";
const subjectSchema = new Schema({
    name: { 
        type: String, 
        required: true 
    },
    teacherId: { 
        type:Schema.Types.ObjectId, 
        ref: 'Staff', 
        required: true 
    },
}, { timestamps:true });

const classSchema = new Schema({
    className: {
        type: String,
        required: true
    },
    teacherId: {
        type: Schema.Types.ObjectId,
        ref: "Staff",
        required: true
    },
    student: [{
        type: Schema.Types.ObjectId,
        ref: "Student"
    }],
    subjects: [subjectSchema]
}, { timestamps: true })

export const Class = mongoose.model("Class", classSchema)
import mongoose, { Schema } from "mongoose";

const classSchema = new Schema({
    name: {
        type: String,
        required: true
    }, // e.g., "Grade 5"
    sections: [{
        type: String,
        enum:['A','B','C']
    }], // e.g., ["A", "B", "C"]
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    }], // Subjects offered
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
    }, // Assigned class teacher
}, { timestamps: true });

export const Class = mongoose.model("Class", classSchema)
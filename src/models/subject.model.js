import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema({
    name: {
        type: String,
        required: true
    }, // e.g., "Mathematics"
    code: {
        type: String,
        required: true
    }, // e.g., "MATH101"
}, { timestamps: true });

export const Subject = mongoose.model("Subjects", subjectSchema)
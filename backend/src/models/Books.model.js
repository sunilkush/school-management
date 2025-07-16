import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true },
    author: String,
    publisher: String,
    isbn: { 
        type: String, 
        unique: true, 
        sparse: true },
    category: String,
    totalCopies: { type: Number, 
        default: 1 },
    availableCopies: { type: Number, 
        default: 1 },
    shelfLocation: String,
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "Schools",
        required: true,
    },
    academicYearId: {
        type: Schema.Types.ObjectId,
        ref: "AcademicYears",
    },
}, { timestamps: true });

export const Book = mongoose.model("Books", bookSchema);
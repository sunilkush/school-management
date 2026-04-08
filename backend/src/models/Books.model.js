import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    author: {
        type: String,
        required: true,
        lowercase: true,
    },
    publisher: {
        type: String,
        required: true,
        lowercase: true
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true
    },
    category: {
        type: String,
        required: true,
        lowercase: true
    },
    totalCopies: {
        type: Number,
        default: 1
    },
    availableCopies: {
        type: Number,
        default: 1
    },
    shelfLocation: {
        type: String,
        required: true,
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: "School",
        required: true,
    },
    academicYearId: {
        type: Schema.Types.ObjectId,
        ref: "AcademicYear",
    },
}, { timestamps: true });

export const Book = mongoose.model("Book", bookSchema);
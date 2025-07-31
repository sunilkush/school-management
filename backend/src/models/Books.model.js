import mongoose, { Schema } from "mongoose";

const bookSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
    },
    publisher: {
        type: String,
        required: true,
    },
    isbn: {
        type: String,
        unique: true,
        sparse: true
    },
    category: {
        type: String,
        required: true,
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
        ref: "Schools",
        required: true,
    },
    academicYearId: {
        type: Schema.Types.ObjectId,
        ref: "AcademicYears",
    },
}, { timestamps: true });

export const Book = mongoose.model("Books", bookSchema);
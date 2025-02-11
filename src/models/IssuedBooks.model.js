import mongoose, { Schema } from "mongoose";

const IssuedBookSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        bookId: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        issueDate: {
            type: Date,
            required: true,
        },
        returnDate: {
            type: Date
        },
        status: {
            type: String,
            enum: ['issued', 'returned'],
            required: true,
        },
    },
    { timestamps: true }
);

export const IssuedBook = mongoose.model("IssuedBook", IssuedBookSchema)

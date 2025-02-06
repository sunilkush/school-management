import mongoose, { Schema } from "mongoose";

const BookSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        author: {
            type: String,
            required: true
        },
        ISBN: {
            type: String,
            required: true
        },
        availableCopies: {
            type: Number,
            required: true
        },
    },
    { timestamps: true }
);


export const Book = mongoose.model("Books", BookSchema)
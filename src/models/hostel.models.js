import { model } from "mongoose";

import mongoose, { Schema } from "mongoose";

const hostelSchema = new Schema({
    roomNumber: {
        type: String,
        required: true,
    },
    capacity: {
        type: String,
        required: true,
    },
    occupants: [{
        type: Schema.Types.ObjectId,
        ref: "Student"
    }]
}, {
    timestamps: true
})

export const Hostel = mongoose.model("Hostel",hostelSchema)
import mongoose, { Schema } from "mongoose";
const HostelSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        roomNumber: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['occupied', 'vacant'],
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export const Hostel = mongoose.model("Hostel", HostelSchema)
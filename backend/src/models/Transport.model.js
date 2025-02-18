import mongoose, { Schema } from "mongoose";

const TransportSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        busNumber: {
            type: String,
            required: true,
        },
        route: {
            type: String,
            required: true,
        },
        driverName: {
            type: String,
            required: true,
        },
        driverContact: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Transport = mongoose.model("Transport", TransportSchema)
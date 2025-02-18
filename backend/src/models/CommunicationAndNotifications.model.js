import mongoose, { Schema } from "mongoose";
const CommunicationSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['Email', 'SMS', 'WhatsApp', 'Push Notification'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['sent', 'pending'],
            required: true,
        },
    },
    { timestamps: true }
);

export const Communication = mongoose.model("Communication", CommunicationSchema)
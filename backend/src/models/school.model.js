import mongoose, { Schema } from "mongoose";

const schoolSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true
    },
    address: {
        type: String,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    phone: {
        type: Number,

    },
    website: {
        type: String,

    },
    logo: {
        type: String,
    },
   
    isActive: {
        type: Boolean,
        enum: ['true', 'false'],
        default: true

    }
}, { timestamps: true })

export const School = mongoose.model("Schools", schoolSchema)

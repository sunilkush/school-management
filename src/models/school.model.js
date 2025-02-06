import mongoose, { Schema } from "mongoose";

const schoolSchema = new Schema({
    name: {
        tpye: String,
        required: true
    },
    address: {
        type: String,

    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,

    },
    website: {
        type: String,

    },
    logo: {
        type: String,
    }
}, { timestamps: true })

export const School = mongoose.model("Schools", schoolSchema)
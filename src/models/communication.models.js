import mongoose, { Schema } from "mongoose";

const communicationSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    sentAt: {
        type: Date,
        default: Date.now
    },
}, { timestamps: true })

export Communication = mongoose.model("Communication", communicationSchema)


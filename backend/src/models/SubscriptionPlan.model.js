import mongoose from 'mongoose';
const subscriptionPlanSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    price:{
        type: Number,
        required: true,
        min: 0
    },
    durationInDays: {
        type: Number,
        required: true,
        min: 1
    },
    features: [
        {
            module: {
                type: String,
                required: true
            },
            allowed:{
                type: Boolean,
                default: true
            },
            limits: mongoose.Schema.Types.Mixed // e.g. { maxStudents: 500 }
        }
    ],
    isActive: { 
        type: Boolean, 
        default: true 
    },
}, { timestamps: true });

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
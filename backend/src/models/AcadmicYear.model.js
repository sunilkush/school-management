import mongoose, { Schema } from "mongoose";

const acadmicYear = new Schema({
    name: {
        type: String,
        required: [true, 'Academic Year name is required'],
        unique: true,
        trim: true,
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
})

export const AcademicYear = mongoose.model('AcademicYear', acadmicYear)
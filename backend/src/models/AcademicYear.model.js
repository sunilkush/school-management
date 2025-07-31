import mongoose, { Schema } from "mongoose";

const AcademicYearSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Academic Year name is required'],
        trim: true,
    },
    schoolId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: [true, 'School ID is required'],
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

export const AcademicYear = mongoose.model('AcademicYears', AcademicYearSchema)
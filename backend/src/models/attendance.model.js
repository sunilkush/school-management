import mongoose, { Schema } from "mongoose";

const AttendanceSchema = new Schema(
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
        classId: {
            type: Schema.Types.ObjectId,
            ref: 'Classes',
            required: true,
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'leave'],
            required: true,
        },
        recordedBy: {
            type: Schema.Types.ObjectId,  // user id 
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true // Only stores createdAt
    }
);

export const Attendance = mongoose.model('Attendance', AttendanceSchema);


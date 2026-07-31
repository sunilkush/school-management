import mongoose, { Schema } from "mongoose";
const HostelSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        academicYearId:{
                    type: Schema.Types.ObjectId,
                    ref: "AcademicYear",
                    required: true
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
    { timestamps: true }
);

HostelSchema.index({ schoolId: 1, academicYearId: 1 });

export const Hostel = mongoose.model("Hostel", HostelSchema)
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
                    ref: "AcademicYears",
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

export const Hostel = mongoose.model("Hostel", HostelSchema)
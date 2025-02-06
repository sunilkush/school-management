import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        teacherId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        classes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Classes',
            },
        ],
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

export const Subject = mongoose.model('Subject', SubjectSchema);

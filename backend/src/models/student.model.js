import mongoose, { Schema } from 'mongoose'

const StudentSchema = new Schema(
    {
        userId: { 
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true },
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
        },
        dateOfBirth: {
            type: Date,
            required: true,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
        },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        guardian: {
            name: { type: String, required: true },
            relationship: { type: String, required: true },
            phoneNumber: { type: String, required: true },
        },
        enrollmentNumber: {
            type: String,
            unique: true,
            required: true,
        },
        classId: { type: Schema.Types.ObjectId, ref: "Classes", required: true },
        section: {
            type: String,
            required: true,
        },
        admissionDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
    },
    { timestamps: true }
)

export const Student = mongoose.model('Student', StudentSchema)

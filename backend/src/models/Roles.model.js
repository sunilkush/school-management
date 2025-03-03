import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ["Super Admin", "Admin", "Teacher", "Student", "Parent"],
    },
    permissions: [
        {
            module: {
                type: String,
                required: true,
                enum: [
                    "Users",
                    "Students",
                    "Teachers",
                    "Classes",
                    "Subjects",
                    "Exams",
                    "Attendance",
                    "Hostel",
                    "Library",
                    "Finance",
                    "Settings",
                ],
            },
            actions: [
                {
                    type: String,
                    required: true,
                    enum: ["create", "read", "update", "delete"],
                },
            ],
        },
    ],
}, { timestamps: true });

export const Role = mongoose.model("Role", roleSchema);

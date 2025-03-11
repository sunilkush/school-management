import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["Super Admin", "School Admin", "Teacher", "Student", "Parent"],
    },
    permissions: [
      {
        module: {
          type: String,
          required: true,
          enum: [
            "Schools",
            "Users",
            "Teachers",
            "Students",
            "Parents",
            "Classes",
            "Subjects",
            "Exams",
            "Attendance",
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
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", roleSchema);

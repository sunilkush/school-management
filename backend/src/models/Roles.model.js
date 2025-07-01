import mongoose, { Schema } from "mongoose";

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["Super Admin", "School Admin", "Teacher", "Student", "Parent", "Accountant", "Staff", "Librarian", "Hostel Warden", "Transport Manager", "Exam Coordinator", "Receptionist","IT Support","Counselor","Subject Coordinator"],
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "Schools",
      required: true,
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
            "Fees",
            "Reports",
            "Hostel",
            "Transport",
            "Assignments",
            "Timetable",
            "Notifications",
            "Expenses",
            "Library",
            "Books",
            "IssuedBooks",
            "Rooms",
            "Routes",
            "Vehicles"
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

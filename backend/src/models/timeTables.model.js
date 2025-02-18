const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: function () {
        return this.role === "student"; // Required for students
      },
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: function () {
        return this.role === "teacher"; // Required for teachers
      },
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },
    startTime: {
      type: String, // Example: "09:00 AM"
      required: true,
    },
    endTime: {
      type: String, // Example: "10:00 AM"
      required: true,
    },
    room: {
      type: String, // Example: "A101"
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const TimeTable = mongoose.model("Timetable", TimetableSchema);

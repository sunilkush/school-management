const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYears",
      required: true
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    schoolClassId: { 
        type: Schema.Types.ObjectId, 
        ref: "SchoolClass",
      required: function () {
        return this.role === "Student"; // Required for students
      },
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: function () {
        return this.role === "Teacher"; // Required for teachers
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
      enum: ["Student", "Teacher", "School Admin"],
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const TimeTable = mongoose.model("Timetable", TimetableSchema);

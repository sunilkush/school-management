import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Class 6"
      lowercase: true,
    },
    
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User", // class teacher
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // enrolled students
      },
    ],
    subjects: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: "Subject", // subject reference
          
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User", // teacher for this subject in this class
        },
      },
    ],
  },
  { timestamps: true }
);

export const Class = mongoose.model("Class", classSchema);

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
      lowercase: true,
    },
    section: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D","E","F"], 
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
          required: true,
        },
        teacherId: {
          type: Schema.Types.ObjectId,
          ref: "User", // teacher who teaches this subject in this class
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Class = mongoose.model("Class", classSchema);

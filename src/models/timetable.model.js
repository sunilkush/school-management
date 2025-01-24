import mongoose, { Schema } from "mongoose";

const timetableSchema = new Schema({
  class: {
    type: Schema.Types.ObjectId,
    ref: "Class",
    required: true
  },
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    required: true
  },
  schedule: [
    {
      period: Number,
      subject: {
        type: Schema.Types.ObjectId,
        ref: "Subject"
      },
      teacher: {
        type: Schema.Types.ObjectId,
        ref: "Teacher"
      },
      startTime: String,
      endTime: String,
    },
  ],
}, { timestamps: true });

export const Student = mongoose.model("Students", timetableSchema)
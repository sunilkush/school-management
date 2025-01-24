import mongoose, { Schema } from "mongoose";

const teacherSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: "Subject"
  }], // Subjects they teach
  qualification: {
    type: String
  },
  experience: {
    type: Number
  }, // Experience in years
}, {
  timestamps: true
});

export const Teacher = mongoose.model("Teachers", teacherSchema)
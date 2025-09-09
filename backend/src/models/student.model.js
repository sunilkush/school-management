import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ek hi user ek hi student hoga
    },
    picture: {
      type: String, // URL ya file path
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    religion: String,
    cast: String,
    bloodGroup: String,
    address: String,
    identificationMark: String,

    // 🟢 Father Info
    fatherInfo: {
      name: String,
      NID: String,
      occupation: String,
      education: String,
      mobile: String,
      profession: String,
      income: String,
    },

    // 🔵 Mother Info
    motherInfo: {
      name: String,
      NID: String,
      occupation: String,
      education: String,
      mobile: String,
      profession: String,
      income: String,
    },

    // 🟣 Other Info
    orphan: {
      type: String,
      enum: ["Yes", "No"],
    },
    family: String,
    disease: String,
    notes: String,
    siblings: String,
    previousSchool: String,
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);

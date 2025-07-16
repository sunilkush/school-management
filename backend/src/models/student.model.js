import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYears",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schools",
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
      required: true,
    },
    section: {
      type: String,
    },
    picture: {
      type: String, // URL or file path
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    feeDiscount: {
      type: Number,
      default: 0,
    },
    smsMobile: {
      type: String,
    },

    // 🟣 Other Info Section
    dateOfBirth: Date,
    birthFormId: String,
    orphan: {
      type: String,
      enum: ["Yes", "No"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    cast: String,
    osc: String,
    identificationMark: String,
    previousSchool: String,
    religion: String,
    bloodGroup: String,
    previousId: String,
    family: String,
    disease: String,
    notes: String,
    siblings: String,
    address: String,

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

    status: {
      type: String,
      enum: ["active", "inactive", "alumni"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Student = mongoose.model("Students", studentSchema);

import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema(
  {
    // Link with User model
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Multi-school support
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", },

    // Basic Info

    phoneNo: {
      type: String,
      required: true,
      match: [/^\+?[0-9]{10,13}$/, "Invalid phone number"],
    },
    maritalStatus: { type: String, enum: ["Single", "Married", "Divorced", "Widowed"] },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dateOfBirth: { type: Date },
    bloodType: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    religion: {
      type: String,
      enum: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"]
    },
    // Address
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },

    // ID Proof
    idProof: {
      type: { type: String, enum: ["Aadhar", "PAN", "Passport", "Other"] },
      number: String,
    },
    citizenAddress: {
      type: String
    },
    // Employment

    department: { type: String }, // or ObjectId ref if you want separate Department collection
    designation: { type: String }, // or ObjectId ref
    employeeStatus: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract"],
    },
    joinDate: { type: Date },

    // Salary
    salaryId: {
      type: Schema.Types.ObjectId, ref: "User",
      ref: "Salary",
    },

    // Teacher-specific fields

    experience: String,
    qualification: {
      type: [String], // array of strings
      required: true,
    },
    subjects: [
      {
        type: Schema.Types.ObjectId, // array of ObjectId
        ref: "Subject",
      },
    ],

    // Banking Details (Salary Credit ke liye)
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branch: String,
      panNumber: String,
      pfNumber: String,
      esiNumber: String,
    },
    // Common
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employee = mongoose.model("Employee", employeeSchema);

import mongoose, { Schema } from "mongoose";

const employeeSchema = new Schema(
  {
    // Link with User model
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Multi-school support
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear" },

    // Basic Info
   
    phoneNo: {
      type: String,
      required: true,
      match: [/^\+?[0-9]{10,13}$/, "Invalid phone number"],
    },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    dateOfBirth: { type: Date },

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

    // Employment
    employeeType: { type: String, enum: ["Teacher", "Staff"], required: true },
    department: { type: String }, // or ObjectId ref if you want separate Department collection
    designation: { type: String }, // or ObjectId ref
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract"],
    },
    joinDate: { type: Date },

    // Salary
    salary: {
      basicPay: { type: Number, default: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 },
    },

    // Teacher-specific fields
    qualification: String,
    experience: String,
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    assignedClasses: [
      {
        classId: { type: Schema.Types.ObjectId, ref: "Class" },
        sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
        subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
        schedule: [{ day: String, time: String }],
      },
    ],

    // Common
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employee = mongoose.model("Employee", employeeSchema);

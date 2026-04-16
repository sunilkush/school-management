import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    /* ===========================
       👤 STUDENT USER LINK
    ============================ */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one user = one student
      index: true,
    },

    /* ===========================
       📸 BASIC INFO
    ============================ */
    picture: {
      type: String,
      default: null,
    },

    dateOfBirth: {
      type: Date,
      index: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },

    religion: {
      type: String,
      trim: true,
    },

    cast: {
      type: String,
      trim: true,
    },

    bloodGroup: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    identificationMark: {
      type: String,
      trim: true,
    },

    /* ===========================
       👨‍👩‍👧 PARENTS (REFERENCE BASED)
    ============================ */

    fatherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    motherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },

    // Optional (future proof)
    guardianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    fatherInfo: {
      name: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },

    motherInfo: {
      name: { type: String, trim: true, default: "" },
      mobile: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
    },

    /* ===========================
       🟣 OTHER INFO
    ============================ */

    orphan: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    family: {
      type: String,
      trim: true,
    },

    disease: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    siblings: {
      type: String,
      trim: true,
    },

    previousSchool: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   🔥 INDEXES (PERFORMANCE)
=========================== */

// fast lookup
studentSchema.index({ fatherId: 1 });
studentSchema.index({ motherId: 1 });

// optional search
studentSchema.index({ dateOfBirth: 1 });

export const Student = mongoose.model("Student", studentSchema);

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
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      index: true,
      default: null,
    },
    /* ===========================
       📸 BASIC INFO
    ============================ */
    picture: {
      type: String,
      default: null,
    },

    /* ===========================
       📎 ADMISSION DOCUMENTS
    ============================ */
    documents: {
      type: [
        {
          name: { type: String, trim: true },
          url: { type: String, required: true },
          mimeType: { type: String, trim: true },
          publicId: { type: String, trim: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "alumni", "transferred"],
      default: "active",
      index: true,
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
studentSchema.index({ schoolId: 1, status: 1 });
export const Student = mongoose.model("Student", studentSchema);

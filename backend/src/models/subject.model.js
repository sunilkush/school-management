import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    // 🔹 Basic Details
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      uppercase: true, // prevent duplicates like "math" vs "Math"
    },

    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true, // unique system-wide code
    },

    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // 🔹 Classification
    category: {
      type: String,
      enum: ["Core", "Elective", "Language", "Practical", "Optional"],
      default: "Core",
    },

    type: {
      type: String,
      enum: ["Theory", "Practical", "Both"],
      default: "Theory",
    },

    maxMarks: {
      type: Number,
      default: 100,
      min: 1,
    },

    passMarks: {
      type: Number,
      default: 33,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.maxMarks;
        },
        message: "Pass marks cannot exceed maximum marks",
      },
    },

    // 🔹 Role & Ownership Info
    createdByRole: {
      type: String,
      enum: ["Super Admin", "School Admin"],
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // 🔹 Global / School-level Control
    isGlobal: {
      type: Boolean,
      default: false, // true → visible to all schools
    },

    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null, // null if global
      index: true,
    },

    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null, // null if global
      index: true,
    },

    // 🔹 Assignments
    assignedSchools: [
      {
        type: Schema.Types.ObjectId,
        ref: "School",
      },
    ],

    assignedClasses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Class",
      },
    ],

    assignedTeachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Teacher or HOD
      },
    ],

    gradingSchemeId: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
    },

    // 🔹 Status
    isActive: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

//
// 🔹 Indexes
//
subjectSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1 },
  { unique: true, partialFilterExpression: { schoolId: { $type: "objectId" } } }
);

//
// 🔹 Auto-generate shortName & code if missing
//
subjectSchema.pre("save", function (next) {
  if (!this.shortName && this.name)
    this.shortName = this.name.substring(0, 4).toUpperCase();

  if (!this.code && this.name) {
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.code = `${prefix}${randomNum}`;
  }

  next();
});

export const Subject = mongoose.model("Subject", subjectSchema);

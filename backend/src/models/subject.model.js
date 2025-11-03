import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    // 🔹 Basic Details
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      uppercase: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
    },
    shortName: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: { type: String, trim: true },

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
    maxMarks: { type: Number, default: 100, min: 1 },
    passMarks: {
      type: Number,
      default: 33,
      min: 0,
      validate(v) {
        return v <= this.maxMarks;
      },
    },

    // 🔹 Ownership
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
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // 🔹 Global/Local
    isGlobal: { type: Boolean, default: false },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      default: null,
      index: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      default: null,
      index: true,
    },

    // 🔹 Assignments
    assignedSchools: [{ type: Schema.Types.ObjectId, ref: "School" }],
    assignedClasses: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    assignedTeachers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    gradingSchemeId: { type: Schema.Types.ObjectId, ref: "Grade" },

    // 🔹 Status
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    remarks: { type: String, trim: true },
  },
  { timestamps: true }
);

// ✅ Compound index for school-level uniqueness
subjectSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1 },
  {
    unique: true,
    partialFilterExpression: { schoolId: { $exists: true } },
  }
);

// ✅ Auto-generate shortName & code
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

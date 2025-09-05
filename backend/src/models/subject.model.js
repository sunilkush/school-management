import mongoose, { Schema } from "mongoose";

const SubjectSchema = new Schema(
  {
    academicYearId: { 
      type: Schema.Types.ObjectId, 
      ref: 'AcademicYear', 
      required: true 
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    },
    passMarks: {
      type: Number,
      default: 35,
    },
    gradingSchemeId: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// 🔹 Pre-save hook to generate `code` and `shortName`
SubjectSchema.pre("save", function (next) {
  if (!this.shortName && this.name) {
    // Take first 3 letters of name + year (optional)
    this.shortName = this.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  if (!this.code && this.name) {
    // Example: MATH101 => first 4 letters of name + random 3 digit number
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900); // 100-999
    this.code = `${prefix}${randomNum}`;
  }

  next();
});

export const Subject = mongoose.model("Subject", SubjectSchema);

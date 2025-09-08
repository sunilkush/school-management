import mongoose, { Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // subject in-charge / HOD / main teacher
    },

    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true, // avoid duplicates: "Maths" vs "maths"
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true, // unique subject code across system
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

// 🔑 Prevent duplicate subject name in the same school + academic year
subjectSchema.index(
  { name: 1, schoolId: 1, academicYearId: 1 },
  { unique: true }
);

// 🔹 Pre-save hook to auto-generate shortName & code if missing
subjectSchema.pre("save", function (next) {
  if (!this.shortName && this.name) {
    // Example: "Mathematics" => "MATH"
    this.shortName = this.name.substring(0, 4).toUpperCase();
  }

  if (!this.code && this.name) {
    // Example: "MATH101" => first 4 letters + random 3-digit number
    const prefix = this.name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900); // 100-999
    this.code = `${prefix}${randomNum}`;
  }

  next();
});

export const Subject = mongoose.model("Subject", subjectSchema);

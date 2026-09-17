import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index:true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "inactive",
      lowercase: true,
    },
    auditLog: [
      {
        action: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
        message: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * A year's name comes from its dates: "2025-2026" for a session that crosses New Year, and just
 * "2026" for one that runs January to December — "2026-2026" says nothing the single year does not.
 */
export const academicYearName = (startDate, endDate) => {
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return startYear === endYear ? String(startYear) : `${startYear}-${endYear}`;
};

export const academicYearCode = (startDate, endDate) => {
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return startYear === endYear ? `AY${startYear}` : `AY${startYear}${endYear}`;
};

// Auto-generate 'name' & 'code' from startDate and endDate before saving
academicYearSchema.pre("save", function (next) {
  this.name = academicYearName(this.startDate, this.endDate);
  this.code = academicYearCode(this.startDate, this.endDate);
  next();
});

academicYearSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error("Academic year startDate must be before endDate"));
  }
  next();
});

// Prevent updates on archived academic years
academicYearSchema.pre("findOneAndUpdate", async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (docToUpdate?.status === "archived") {
    const err = new Error("Archived academic years cannot be modified.");
    err.statusCode = 403;
    return next(err);
  }
  next();
});
academicYearSchema.index({ schoolId: 1, name: 1 }, { unique: true });
academicYearSchema.index({ schoolId: 1, code: 1 }, { unique: true });
academicYearSchema.index(
  { schoolId: 1, isActive: 1 },
  { partialFilterExpression: { isActive: true } }
);

export const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);



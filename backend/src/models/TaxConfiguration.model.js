import mongoose, { Schema } from "mongoose";

const taxConfigurationSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pfEmployeePercent: { type: Number, default: 12, min: 0 },
    pfEmployerPercent: { type: Number, default: 12, min: 0 },
    esiEmployeePercent: { type: Number, default: 0.75, min: 0 },
    esiEmployerPercent: { type: Number, default: 3.25, min: 0 },
    tdsPercent: { type: Number, default: 0, min: 0 },
    taxRegime: { type: String, enum: ["old", "new"], default: "new" },
    slabRules: { type: [Schema.Types.Mixed], default: [] },
    investmentDeclarationEnabled: { type: Boolean, default: true },
    form16Enabled: { type: Boolean, default: true },
    professionalTax: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

taxConfigurationSchema.index({ schoolId: 1, academicYearId: 1, isActive: 1 });

export const TaxConfiguration = mongoose.model("TaxConfiguration", taxConfigurationSchema);

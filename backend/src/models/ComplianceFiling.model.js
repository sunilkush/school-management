import mongoose, { Schema } from "mongoose";

const complianceFilingSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["tds", "form_16", "pf_return", "esi_return", "professional_tax", "labour_compliance"], required: true, index: true },
    period: { type: String, trim: true, required: true },
    dueDate: { type: Date, default: null },
    status: { type: String, enum: ["draft", "ready", "filed", "overdue"], default: "draft", index: true },
    amount: { type: Number, default: 0 },
    filingRef: { type: String, trim: true, default: "" },
    documents: { type: [String], default: [] },
  },
  { timestamps: true }
);

complianceFilingSchema.index({ schoolId: 1, academicYearId: 1, type: 1, period: 1 }, { unique: true });

export const ComplianceFiling = mongoose.model("ComplianceFiling", complianceFilingSchema);

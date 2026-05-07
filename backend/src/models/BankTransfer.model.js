import mongoose, { Schema } from "mongoose";

const bankTransferSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    payrollRunId: { type: Schema.Types.ObjectId, ref: "PayrollRun", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    format: { type: String, enum: ["bank_csv", "neft", "tally", "erp"], default: "bank_csv" },
    totalAmount: { type: Number, default: 0 },
    totalEmployees: { type: Number, default: 0 },
    status: { type: String, enum: ["generated", "uploaded", "paid", "failed"], default: "generated", index: true },
    fileName: { type: String, trim: true, default: "" },
    rows: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

bankTransferSchema.index({ schoolId: 1, payrollRunId: 1 }, { unique: true });

export const BankTransfer = mongoose.model("BankTransfer", bankTransferSchema);

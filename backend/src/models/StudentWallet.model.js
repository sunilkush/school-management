import mongoose, { Schema } from "mongoose";

const studentWalletSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

studentWalletSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

export const StudentWallet =
  mongoose.models.StudentWallet || mongoose.model("StudentWallet", studentWalletSchema);

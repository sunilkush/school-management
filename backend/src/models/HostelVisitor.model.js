import mongoose, { Schema } from "mongoose";

const HostelVisitorSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    passNumber: { type: String, trim: true, index: true },

    visitorName: { type: String, required: true, trim: true },
    visitorPhone: { type: String, required: true, trim: true },
    relation: {
      type: String,
      enum: ["father", "mother", "guardian", "sibling", "relative", "friend", "other"],
      required: true,
    },
    purpose: { type: String, required: true, trim: true },

    idType: {
      type: String,
      enum: ["aadhar", "voter_id", "passport", "driving_licence", "pan", "other", ""],
      default: "",
    },
    idNumber: { type: String, trim: true },

    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date, default: null },

    status: {
      type: String,
      enum: ["visiting", "exited"],
      default: "visiting",
      index: true,
    },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

HostelVisitorSchema.index({ schoolId: 1, createdAt: -1 });
HostelVisitorSchema.index({ schoolId: 1, studentId: 1 });

HostelVisitorSchema.pre("save", async function (next) {
  if (!this.passNumber) {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.passNumber = `VP-${ymd}-${rand}`;
  }
  next();
});

export const HostelVisitor = mongoose.model("HostelVisitor", HostelVisitorSchema);

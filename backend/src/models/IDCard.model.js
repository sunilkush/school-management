import mongoose, { Schema } from "mongoose";

export const ID_CARD_HOLDER_TYPES = ["Student", "Employee"];

const idCardSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    holderType: { type: String, enum: ID_CARD_HOLDER_TYPES, required: true, index: true },
    holderId: { type: Schema.Types.ObjectId, required: true, refPath: "holderType", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    cardNumber: { type: String, required: true, trim: true, uppercase: true },
    issueDate: { type: Date, required: true, default: Date.now },
    validUntil: { type: Date, default: null },

    // ── Snapshot fields ──
    fullName: { type: String, required: true, trim: true },
    photoUrl: { type: String, trim: true, default: "" },
    bloodGroup: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },

    // Printed on the card, so it is snapshotted like every other field here rather than read
    // live — a card is a physical object and must keep saying what it said when it was issued.
    dateOfBirth: { type: Date, default: null },

    // ── Student-only ──
    className: { type: String, trim: true, default: "" },
    sectionName: { type: String, trim: true, default: "" },
    rollNumber: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },

    // ── Staff-only ──
    designation: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    employeeCode: { type: String, trim: true, default: "" },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active", index: true },
    deactivatedAt: { type: Date, default: null },
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deactivateReason: { type: String, trim: true, default: "" },

    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

idCardSchema.index({ schoolId: 1, cardNumber: 1 }, { unique: true });
idCardSchema.index({ schoolId: 1, holderType: 1, holderId: 1, status: 1 });
idCardSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export const IDCard = mongoose.models.IDCard || mongoose.model("IDCard", idCardSchema);

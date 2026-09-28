import mongoose, { Schema } from "mongoose";

export const LIBRARY_CARD_HOLDER_TYPES = ["Student", "Employee"];

/**
 * A library membership card. Separate from the school ID card (IDCard.model.js): a school may run
 * its library without issuing ID cards, a card can be revoked for library reasons (lost books,
 * unpaid fines) without touching the ID card, and it carries its own expiry.
 *
 * "Expired" is not stored — it is an Active card whose expiryDate has passed, worked out when the
 * cards are read, so nothing has to run at midnight to keep it true.
 */
const libraryCardSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    holderType: { type: String, enum: LIBRARY_CARD_HOLDER_TYPES, required: true },
    holderId: { type: Schema.Types.ObjectId, required: true, refPath: "holderType" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    cardNumber: { type: String, required: true, trim: true, uppercase: true },
    issueDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true },

    // Snapshot at issue, like the ID card: the card keeps saying what it said when it was issued.
    fullName: { type: String, required: true, trim: true },
    className: { type: String, trim: true, default: "" },
    sectionName: { type: String, trim: true, default: "" },
    registrationNumber: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    employeeCode: { type: String, trim: true, default: "" },

    status: { type: String, enum: ["Active", "Revoked"], default: "Active" },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    revokeReason: { type: String, trim: true, default: "" },

    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

libraryCardSchema.index({ schoolId: 1, cardNumber: 1 }, { unique: true });
// One live card per person. Revoked cards stay on file, so the rule only covers Active ones —
// and because it is an index, two admins issuing at the same moment cannot both succeed.
libraryCardSchema.index(
  { schoolId: 1, holderType: 1, holderId: 1 },
  { unique: true, partialFilterExpression: { status: "Active" }, name: "one_active_card_per_holder" }
);
libraryCardSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export const LibraryCard =
  mongoose.models.LibraryCard || mongoose.model("LibraryCard", libraryCardSchema);

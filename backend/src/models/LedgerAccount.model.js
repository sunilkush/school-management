import mongoose, { Schema } from "mongoose";

/**
 * One line of a school's chart of accounts.
 *
 * `type` decides everything downstream — which side of the ledger increases the balance, whether
 * the account lands on the Profit & Loss or the Balance Sheet, and how statements group it. It is
 * therefore fixed at creation and never editable; changing an account's type after entries exist
 * would silently restate every past statement.
 */

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "income", "expense"];

// Assets and expenses increase on the debit side; liabilities, equity and income on the credit
// side. Every balance calculation in ledger.service.js derives from this one map.
export const NORMAL_BALANCE = {
  asset: "debit",
  expense: "debit",
  liability: "credit",
  equity: "credit",
  income: "credit",
};

const ledgerAccountSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },

    // Numeric code by convention: 1xxx asset, 2xxx liability, 3xxx equity, 4xxx income,
    // 5xxx expense. Not enforced — a school may already have its own numbering.
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ACCOUNT_TYPES, required: true },

    parentId: { type: Schema.Types.ObjectId, ref: "LedgerAccount", default: null },
    description: { type: String, trim: true, default: "" },

    // Seeded accounts the auto-posting layer will target by code. They can be renamed but not
    // deleted, so a posting rule can never lose the account it writes to.
    isSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ledgerAccountSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export const LedgerAccount =
  mongoose.models.LedgerAccount || mongoose.model("LedgerAccount", ledgerAccountSchema);

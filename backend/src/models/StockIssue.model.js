import mongoose, { Schema } from "mongoose";
import { highestSuffix, nextSequence } from "../utils/sequence.js";

const StockIssueSchema = new Schema(
  {
    schoolId:           { type: Schema.Types.ObjectId, ref: "School", required: true },
    issueNumber:        { type: String },
    inventoryItemId:    { type: Schema.Types.ObjectId, ref: "Inventory", required: true },
    itemName:           { type: String, required: true },
    quantity:           { type: Number, required: true, min: 1 },
    unit:               { type: String, default: "pcs" },
    issuedTo:           { type: String, required: true, trim: true },
    issuedToUserId:     { type: Schema.Types.ObjectId, ref: "User", default: null },
    department:         { type: String, trim: true, default: "" },
    purpose:            { type: String, trim: true, default: "" },
    issuedBy:           { type: Schema.Types.ObjectId, ref: "User" },
    issueDate:          { type: Date, default: Date.now },
    expectedReturnDate: { type: Date, default: null },
    returnedQuantity:   { type: Number, default: 0, min: 0 },
    returnDate:         { type: Date, default: null },
    status:             {
      type: String,
      enum: ["issued", "returned", "partial", "overdue"],
      default: "issued",
    },
  },
  { timestamps: true }
);

StockIssueSchema.index({ schoolId: 1, status: 1 });
StockIssueSchema.index({ schoolId: 1, inventoryItemId: 1 });

// Numbered from an atomic counter per school and year, as purchase orders are: counting the
// issues and adding one gave issues made together the same number.
StockIssueSchema.pre("save", async function (next) {
  if (!this.issueNumber) {
    const year = new Date().getFullYear();
    const prefix = `ISS-${year}-`;
    const Model = this.constructor;
    const seq = await nextSequence(`stockissue:${this.schoolId}:${year}`, async () => {
      const issued = await Model.find({ schoolId: this.schoolId, issueNumber: new RegExp(`^${prefix}`) }).select("issueNumber").lean();
      return highestSuffix(issued.map((i) => i.issueNumber), prefix);
    });
    this.issueNumber = `${prefix}${String(seq).padStart(4, "0")}`;
  }
  next();
});

export const StockIssue = mongoose.model("StockIssue", StockIssueSchema);

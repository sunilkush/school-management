import mongoose, { Schema } from "mongoose";

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

StockIssueSchema.pre("save", async function (next) {
  if (!this.issueNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ schoolId: this.schoolId });
    this.issueNumber = `ISS-${year}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

export const StockIssue = mongoose.model("StockIssue", StockIssueSchema);

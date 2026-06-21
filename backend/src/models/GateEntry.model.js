import mongoose, { Schema } from "mongoose";

const gateEntrySchema = new Schema(
  {
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    name:      { type: String, required: true, trim: true },
    type:      { type: String, enum: ["Visitor", "Parent", "Vendor", "Contractor", "Staff", "Student", "Other"], default: "Visitor" },
    phone:     { type: String, trim: true },
    purpose:   { type: String, trim: true },
    vehicleNo: { type: String, trim: true },
    gate:      { type: String, enum: ["Main", "Side", "Back", "Other"], default: "Main" },
    entryTime: { type: Date, default: Date.now },
    exitTime:  { type: Date },
    status:    { type: String, enum: ["Inside", "Exited"], default: "Inside" },
    loggedBy:  { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

gateEntrySchema.index({ schoolId: 1, entryTime: -1 });

export const GateEntry = mongoose.model("GateEntry", gateEntrySchema);

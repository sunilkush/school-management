import mongoose, { Schema } from "mongoose";

const callLogSchema = new Schema(
  {
    schoolId:    { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    callerName:  { type: String, required: true, trim: true },
    phone:       { type: String, trim: true },
    type:        { type: String, enum: ["Incoming", "Outgoing", "Missed"], default: "Incoming" },
    purpose:     { type: String, trim: true },
    duration:    { type: Number, default: 0 },
    notes:       { type: String, trim: true },
    handledBy:   { type: Schema.Types.ObjectId, ref: "User" },
    callTime:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

callLogSchema.index({ schoolId: 1, callTime: -1 });

export const CallLog = mongoose.model("CallLog", callLogSchema);

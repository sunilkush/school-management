import mongoose, { Schema } from "mongoose";

// One doc per school, holding that school's own Twilio account so SMS/WhatsApp sends go out
// under their own sender number/branding instead of the shared platform account. A school that
// never configures this keeps working exactly as before — smsServices.js/whatsappServices.js
// fall back to the platform-wide TWILIO_* env vars whenever no enabled config exists here.
const communicationSettingsSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, unique: true },
  provider: { type: String, enum: ["twilio", "none"], default: "none" },

  accountSid: { type: String, trim: true },
  authToken: { type: String, trim: true },
  smsFromNumber: { type: String, trim: true },
  whatsappFromNumber: { type: String, trim: true },

  isSmsEnabled: { type: Boolean, default: false },
  isWhatsappEnabled: { type: Boolean, default: false },

  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export const CommunicationSettings = mongoose.model("CommunicationSettings", communicationSettingsSchema);

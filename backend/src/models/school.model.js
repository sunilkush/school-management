import mongoose, { Schema } from "mongoose";

const schoolSchema = new Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
  },
  address: {
    type: String,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  phone: {
    type: Number,
  },
  website: {
    type: String,
  },
  logo: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Use singular model name "School"
export const School = mongoose.model("School", schoolSchema);



import mongoose, { Schema } from "mongoose";

const healthProfileSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },

    bloodGroup: { type: String, trim: true, default: "" },
    height: { type: Number, default: null }, // cm
    weight: { type: Number, default: null }, // kg

    allergies: { type: [String], default: [] },
    chronicConditions: { type: [String], default: [] },

    medications: {
      type: [
        {
          name: { type: String, trim: true },
          dosage: { type: String, trim: true },
          notes: { type: String, trim: true },
        },
      ],
      default: [],
    },

    vaccinations: {
      type: [
        {
          name: { type: String, trim: true },
          date: { type: Date },
          nextDueDate: { type: Date, default: null },
        },
      ],
      default: [],
    },

    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      relation: { type: String, trim: true, default: "" },
    },
    doctorContact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      clinic: { type: String, trim: true, default: "" },
    },

    notes: { type: String, trim: true, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

healthProfileSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

export const HealthProfile =
  mongoose.models.HealthProfile || mongoose.model("HealthProfile", healthProfileSchema);

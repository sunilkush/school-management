import mongoose, { Schema } from "mongoose";

const ptmSessionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    title: { type: String, required: true, trim: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },

    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    slotDurationMinutes: { type: Number, default: 10, min: 5 },
    location: { type: String, trim: true, default: "" },

    status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ptmSessionSchema.index({ schoolId: 1, schoolClassId: 1, sectionId: 1 });
ptmSessionSchema.index({ schoolId: 1, date: -1 });

export const PTMSession =
  mongoose.models.PTMSession || mongoose.model("PTMSession", ptmSessionSchema);

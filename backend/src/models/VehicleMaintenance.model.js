import mongoose, { Schema } from "mongoose";

const vehicleMaintenanceSchema = new Schema(
  {
    schoolId:      { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    vehicleId:     { type: Schema.Types.ObjectId, ref: "Transport" },
    vehicleNo:     { type: String, trim: true },
    vehicleName:   { type: String, trim: true },
    serviceType:   {
      type: String,
      enum: ["Oil Change", "Tyre Replacement", "Engine Check", "Brake Service", "AC Service", "Other"],
      required: true,
    },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    estimatedCost: { type: Number, default: 0 },
    actualCost:    { type: Number },
    status:        { type: String, enum: ["Scheduled", "In Progress", "Completed", "Cancelled"], default: "Scheduled" },
    notes:         { type: String, trim: true },
    recordedBy:    { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

vehicleMaintenanceSchema.index({ schoolId: 1, scheduledDate: -1 });

export const VehicleMaintenance = mongoose.model("VehicleMaintenance", vehicleMaintenanceSchema);

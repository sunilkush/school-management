import mongoose, { Schema } from "mongoose";

const HostelRoomSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYears",
      default: null,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      min: 1,
      required: true,
    },
    students: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

HostelRoomSchema.index({ schoolId: 1, roomNumber: 1 }, { unique: true });

export const HostelRoom = mongoose.model("HostelRoom", HostelRoomSchema);

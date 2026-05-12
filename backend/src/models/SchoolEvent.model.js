import mongoose, { Schema } from "mongoose";

const EVENT_TYPES = ["Event", "Holiday", "Meeting", "Exam", "Activity", "Reminder"];
const AUDIENCES = ["All", "Students", "Teachers", "Parents", "Staff"];
const STATUSES = ["scheduled", "cancelled", "completed"];

const schoolEventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    type: {
      type: String,
      enum: EVENT_TYPES,
      default: "Event",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    location: {
      type: String,
      trim: true,
      default: "",
      maxlength: 160,
    },
    audience: {
      type: String,
      enum: AUDIENCES,
      default: "All",
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      trim: true,
      default: "#1677ff",
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "scheduled",
      index: true,
    },
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

schoolEventSchema.pre("validate", function validateDates(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    return next(new Error("Event end date must be same as or after start date"));
  }
  return next();
});

schoolEventSchema.index({ schoolId: 1, startDate: 1, endDate: 1 });
schoolEventSchema.index({ schoolId: 1, title: "text", description: "text", location: "text" });

export const SCHOOL_EVENT_TYPES = EVENT_TYPES;
export const SCHOOL_EVENT_AUDIENCES = AUDIENCES;
export const SCHOOL_EVENT_STATUSES = STATUSES;
export const SchoolEvent = mongoose.model("SchoolEvent", schoolEventSchema);

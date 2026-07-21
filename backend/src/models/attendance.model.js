import mongoose, { Schema } from "mongoose";

const ATTENDANCE_STATUSES = ["present", "absent", "late", "halfday", "leave"];
const ATTENDANCE_ROLES = [
  "student",
  "teacher",
  "staff",
  "support_staff",
  "accountant",
  "admin",
  "school_admin",
  "super_admin",
  "principal",
  "vice_principal",
  "subject_coordinator",
  "librarian",
  "hostel_warden",
  "transport_manager",
  "exam_coordinator",
  "receptionist",
  "it_support",
  "counselor",
  "security",
  "parent",
];
const attendanceSchema = new Schema(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ATTENDANCE_ROLES,
      required: true,
    },
    schoolClassId: {
      type: Schema.Types.ObjectId,
      ref: "SchoolClass",
      default: null,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    checkInGps: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },
    checkOutGps: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      accuracy: { type: Number, default: null },
    },
    gpsVerified: { type: Boolean, default: false },
    distanceFromSchool: { type: Number, default: null },
    // Set by the daily auto-checkout job (jobs/autoCheckout.job.js) when it force-closes a
    // check-in that never got a real check-out — distinguishes a system-forced checkout from
    // one the user actually performed.
    autoCheckedOut: { type: Boolean, default: false },
  },
  { timestamps: true }
);

attendanceSchema.index({ schoolId: 1, userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ schoolId: 1, schoolClassId: 1, sectionId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, role: 1, date: 1 });

attendanceSchema.pre("save", function normalizeDate(next) {
  if (this.date) {
    const normalized = new Date(this.date);
    normalized.setUTCHours(0, 0, 0, 0);
    this.date = normalized;
  }
  next();
});

export { ATTENDANCE_STATUSES, ATTENDANCE_ROLES };
export const Attendance = mongoose.model("Attendance", attendanceSchema);

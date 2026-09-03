import mongoose, { Schema } from "mongoose";

/**
 * A live online class — one scheduled session for a class/section/subject.
 *
 * This does NOT host video. Nothing here creates a Zoom meeting or a Google Meet room: doing so
 * needs the school's own account and an OAuth app, which is a setup step most schools will never
 * complete. Instead the school pastes the link it already uses, and this handles the part that is
 * genuinely missing — who the class is for, when it runs, who turned up, and where the recording
 * went afterwards. It works with Zoom, Meet, Teams, Jitsi or anything else on day one.
 *
 * A saved room link can be reused for a recurring class, which is what schools actually do.
 */

export const ONLINE_CLASS_PROVIDERS = ["zoom", "google_meet", "teams", "jitsi", "other"];

const onlineClassSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null, index: true },

    schoolClassId: { type: Schema.Types.ObjectId, ref: "SchoolClass", required: true, index: true },
    // Null means the whole class, every section — the same convention study materials use.
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", default: null },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },

    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },

    provider: { type: String, enum: ONLINE_CLASS_PROVIDERS, default: "other" },
    meetingLink: { type: String, required: true, trim: true },
    meetingId: { type: String, trim: true, default: "" },
    passcode: { type: String, trim: true, default: "" },

    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    cancelledReason: { type: String, trim: true, default: "" },

    recordingUrl: { type: String, trim: true, default: "" },

    /**
     * How early a student may see the link, in minutes. A link that sits visible for a week gets
     * forwarded outside the school; one that appears five minutes before the class does not.
     */
    linkVisibleBeforeMin: { type: Number, default: 15, min: 0, max: 1440 },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

onlineClassSchema.index({ schoolId: 1, schoolClassId: 1, sectionId: 1, scheduledStart: -1 });
onlineClassSchema.index({ schoolId: 1, teacherId: 1, scheduledStart: -1 });

onlineClassSchema.pre("validate", function checkWindow(next) {
  if (this.scheduledEnd && this.scheduledStart && this.scheduledEnd <= this.scheduledStart) {
    return next(new Error("The class must end after it starts"));
  }
  // Rejected here rather than rendered as a broken button in front of thirty students.
  if (this.meetingLink && !/^https?:\/\/\S+$/i.test(this.meetingLink)) {
    return next(new Error("The meeting link must be a valid http(s) URL"));
  }
  if (this.recordingUrl && !/^https?:\/\/\S+$/i.test(this.recordingUrl)) {
    return next(new Error("The recording link must be a valid http(s) URL"));
  }
  return next();
});

export const OnlineClass =
  mongoose.models.OnlineClass || mongoose.model("OnlineClass", onlineClassSchema);

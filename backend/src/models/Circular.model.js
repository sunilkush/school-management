import mongoose, { Schema } from "mongoose";

/**
 * A circular — a numbered notice the school issues and can be held to later.
 *
 * Not the same thing as a Notification, which already exists here. A notification is a message
 * that goes past in a feed; a circular is a document. It has a number people quote back at you, it
 * lives in an archive somebody searches next year, and some of them carry an acknowledgement that
 * matters: "I have read and understood the revised transport policy" is a different artefact from
 * "this was displayed on their dashboard".
 */

export const CIRCULAR_CATEGORIES = ["Academic", "Fee", "Event", "Policy", "Holiday", "Safety", "Examination", "General"];
export const CIRCULAR_STATUSES = ["draft", "published", "archived"];

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const circularSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null, index: true },

    /** What people quote back — "as per circular 14". Assigned when it is published. */
    circularNumber: { type: String, trim: true, default: "" },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 20000 },
    category: { type: String, enum: CIRCULAR_CATEGORIES, default: "General", index: true },

    /** Links, not uploads — the same choice made for study material and CVs elsewhere here. */
    attachments: { type: [attachmentSchema], default: [] },

    /**
     * Who it is for. Empty everywhere means the whole school.
     *
     * Roles and classes are both allowed because a circular is genuinely addressed either way —
     * "all teaching staff" and "parents of Class 10" are both real audiences and neither can be
     * expressed with the other.
     */
    audience: {
      roles: { type: [String], default: [] },
      schoolClassIds: { type: [Schema.Types.ObjectId], ref: "SchoolClass", default: [] },
      sectionIds: { type: [Schema.Types.ObjectId], ref: "Section", default: [] },
      userIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    },

    /**
     * The recipient list as it stood when the circular went out.
     *
     * Snapshotted rather than worked out live on every read, and the reason matters: a child who
     * joins in November must not appear as "has not acknowledged" a circular issued in August. A
     * live audience query would quietly grow the denominator of every compliance figure the school
     * has already reported.
     */
    recipients: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    recipientCount: { type: Number, default: 0 },

    requiresAcknowledgement: { type: Boolean, default: false, index: true },
    acknowledgementDeadline: { type: Date, default: null },
    /** The exact wording people are agreeing to. Stored so it can be shown and quoted. */
    acknowledgementText: {
      type: String,
      trim: true,
      default: "I have read and understood this circular.",
      maxlength: 500,
    },

    isPinned: { type: Boolean, default: false },
    status: { type: String, enum: CIRCULAR_STATUSES, default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },

    /** Set when this circular replaces an earlier one, because a published one is never edited. */
    supersedesId: { type: Schema.Types.ObjectId, ref: "Circular", default: null },
    supersededById: { type: Schema.Types.ObjectId, ref: "Circular", default: null },

    issuedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

circularSchema.index({ schoolId: 1, status: 1, publishedAt: -1 });
circularSchema.index({ schoolId: 1, circularNumber: 1 });
circularSchema.index({ schoolId: 1, recipients: 1, status: 1 });

/**
 * A published circular's words are frozen.
 *
 * People acknowledged a specific text. Editing it afterwards would leave the school holding
 * signatures against something nobody agreed to — the same reason a posted journal entry and a
 * finalised appraisal are frozen here. A correction is issued as a new circular that supersedes
 * this one, so both remain on the record.
 */
circularSchema.post("init", function captureStatus() {
  this.$locals.originalStatus = this.status;
});

circularSchema.pre("save", function blockPublishedEdits(next) {
  if (this.isNew) return next();
  if (this.$locals.originalStatus !== "published") return next();

  const mutable = new Set([
    "status", "archivedAt", "isPinned", "supersededById",
    "recipients", "recipientCount", "updatedAt",
  ]);
  const touched = this.modifiedPaths().filter((path) => !mutable.has(path.split(".")[0]));
  if (touched.length) {
    return next(new Error("A published circular cannot be edited — issue a new one that supersedes it"));
  }
  return next();
});

export const Circular = mongoose.models.Circular || mongoose.model("Circular", circularSchema);

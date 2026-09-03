import mongoose, { Schema } from "mongoose";

/**
 * A double-entry journal entry: one dated, balanced transaction made of two or more lines.
 *
 * Two rules are enforced here rather than in a controller, because either being broken silently
 * is what makes a set of books untrustworthy:
 *
 *  1. Debits must equal credits. An unbalanced entry is rejected outright — a trial balance that
 *     does not balance is worse than no trial balance at all.
 *  2. A POSTED entry is immutable. Accounting corrects mistakes by adding a reversing entry, not
 *     by editing history; allowing edits would let a past statement change after it was relied on.
 */

const journalLineSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "LedgerAccount", required: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const journalEntrySchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: "AcademicYear", default: null, index: true },

    entryNumber: { type: String, trim: true, index: true },
    date: { type: Date, required: true, index: true },
    narration: { type: String, trim: true, maxlength: 500, default: "" },

    lines: { type: [journalLineSchema], required: true },

    // Where this entry came from. Manual entries leave it null; the auto-posting layer records
    // the originating document so a money event can be traced to its posting and, just as
    // importantly, so an event with NO posting can be found.
    source: {
      model: { type: String, trim: true, default: null },
      documentId: { type: Schema.Types.ObjectId, default: null },
    },

    status: { type: String, enum: ["draft", "posted", "void"], default: "draft", index: true },
    postedAt: { type: Date, default: null },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Set on the entry that reverses another, and on the one being reversed.
    reversesEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry", default: null },
    reversedByEntryId: { type: Schema.Types.ObjectId, ref: "JournalEntry", default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

journalEntrySchema.index({ schoolId: 1, date: 1, status: 1 });
journalEntrySchema.index({ schoolId: 1, "source.model": 1, "source.documentId": 1 });

/** Rounds to paise, so floating-point noise never fails an otherwise balanced entry. */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

journalEntrySchema.pre("validate", function validateBalanced(next) {
  if (!Array.isArray(this.lines) || this.lines.length < 2) {
    return next(new Error("A journal entry needs at least two lines"));
  }

  let debits = 0;
  let credits = 0;
  for (const line of this.lines) {
    const d = round2(line.debit);
    const c = round2(line.credit);
    if (d > 0 && c > 0) {
      return next(new Error("A line cannot carry both a debit and a credit"));
    }
    if (d === 0 && c === 0) {
      return next(new Error("Every line must carry either a debit or a credit"));
    }
    debits += d;
    credits += c;
  }

  if (round2(debits) !== round2(credits)) {
    return next(new Error(`Entry does not balance: debits ${round2(debits)} vs credits ${round2(credits)}`));
  }
  return next();
});

// Remember what the status was when the document was loaded. modifiedPaths() alone cannot tell
// "this was already posted" from "this is being posted right now", and only the former is frozen.
journalEntrySchema.post("init", function captureOriginalStatus() {
  this.$locals.originalStatus = this.status;
});

journalEntrySchema.pre("save", function blockPostedEdits(next) {
  if (this.isNew) return next();
  if (this.$locals.originalStatus !== "posted") return next();

  // Stamping the reversal link is the one change a posted entry still accepts.
  const mutable = new Set(["reversedByEntryId", "updatedAt"]);
  const touched = this.modifiedPaths().filter((path) => !mutable.has(path));
  if (touched.length) {
    return next(new Error("A posted journal entry cannot be edited — reverse it with a new entry instead"));
  }
  return next();
});

export const JournalEntry =
  mongoose.models.JournalEntry || mongoose.model("JournalEntry", journalEntrySchema);

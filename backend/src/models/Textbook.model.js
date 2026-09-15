import mongoose, { Schema } from "mongoose";

/**
 * A published textbook for one class and subject — today, NCERT's own books.
 *
 * The PDFs are NOT copied into this system. NCERT publishes every book free to read on its site, but
 * the books are NCERT's copyright; what is stored here is where the official files live
 * (ncert.nic.in/textbook/pdf/...), checked to exist at import time.
 *
 * Every chapter of the book, with its PDF, is listed on the book itself (`chapters`). Where a chapter
 * is also a curriculum Chapter — the ones question banks and lesson plans use — the two are linked
 * both ways (chapters[].chapterId, Chapter.textbookId). Only chapters whose titles could be read go
 * into the curriculum; a book whose titles are unreadable still opens chapter by chapter here.
 */
const textbookChapterSchema = new Schema(
  {
    bookChapterNo: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    pdfUrl: { type: String, required: true, trim: true },
    // False when the title could not be read from the book (a scanned Contents page, or a Hindi or
    // Sanskrit font whose text comes out broken) and the name is only "Chapter N" / "पाठ N". The PDF
    // is still the real chapter; only its label is generic.
    nameVerified: { type: Boolean, default: false },
    // The curriculum Chapter this is, when it is one (question banks and lesson plans use those).
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter", default: null },
  },
  { _id: false }
);

const textbookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    // NCERT's book code, e.g. "jeff1" = class 10, English medium, First Flight, part 1. Every file
    // name is built from it: <code>01.pdf … <code>NN.pdf, <code>ps.pdf (prelims), <code>dd.zip.
    code: { type: String, required: true, trim: true, lowercase: true },
    source: { type: String, enum: ["NCERT"], default: "NCERT" },
    publisher: { type: String, trim: true, default: "NCERT" },
    medium: { type: String, trim: true, default: "English" },

    boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    boardClassId: { type: Schema.Types.ObjectId, ref: "BoardClass", required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    classNo: { type: Number, min: 1, max: 12, required: true },

    // Order NCERT lists the book in for this class and subject (a subject can have several books).
    order: { type: Number, default: 1 },
    chapterCount: { type: Number, min: 0, default: 0 },
    chapters: { type: [textbookChapterSchema], default: [] },

    prelimsUrl: { type: String, trim: true, default: null },
    bookUrl: { type: String, trim: true, default: null },
    pageUrl: { type: String, trim: true, default: null },

    isActive: { type: Boolean, default: true, index: true },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

textbookSchema.index({ source: 1, code: 1 }, { unique: true });
textbookSchema.index({ classNo: 1, subjectId: 1, order: 1 });

export const Textbook = mongoose.models.Textbook || mongoose.model("Textbook", textbookSchema);

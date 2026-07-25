import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { IssuedBook } from "../models/IssuedBooks.model.js";
import { Book } from "../models/Books.model.js";
import { LibrarySetting } from "../models/LibrarySetting.model.js";
import { Student } from "../models/student.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const resolveSchoolId = (req) =>
  req.user?.schoolId || req.user?.school?._id || req.body?.schoolId || req.query?.schoolId;

const getSettings = async (schoolId) => {
  let settings = await LibrarySetting.findOne({ schoolId });
  if (!settings) settings = new LibrarySetting({ schoolId });
  return settings;
};

const calcFine = (settings, dueDate, returnDate) => {
  const due    = new Date(dueDate);
  const ret    = returnDate ? new Date(returnDate) : new Date();
  const diffMs = ret - due;
  if (diffMs <= 0) return 0;
  const overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) - (settings.gracePeriodDays || 0);
  if (overdueDays <= 0) return 0;
  const raw = overdueDays * (settings.finePerDay || 5);
  return Math.min(raw, settings.maxFinePerBook || 500);
};

// ── Issue a book ──────────────────────────────────────────────────────────────
export const issueBook = asyncHandler(async (req, res) => {
  const { bookId, studentId, issuedToUserId, memberType, issueDate, dueDate } = req.body;
  const schoolId = resolveSchoolId(req);

  if (!schoolId) throw new ApiError(400, "schoolId is required");
  if (!bookId)   throw new ApiError(400, "bookId is required");
  if (!studentId && !issuedToUserId) throw new ApiError(400, "studentId or issuedToUserId is required");

  const book = await Book.findOne({ _id: bookId, schoolId });
  if (!book) throw new ApiError(404, "Book not found");
  if (book.availableCopies <= 0) throw new ApiError(400, "No available copies of this book");

  const settings = await getSettings(schoolId);

  // Calculate default dueDate if not supplied
  const computedDue = dueDate
    ? new Date(dueDate)
    : (() => {
        const d = new Date(issueDate || Date.now());
        const days = memberType === "Teacher" ? settings.maxDaysToReturnTeacher : settings.maxDaysToReturnStudent;
        d.setDate(d.getDate() + (days || 15));
        return d;
      })();

  const issuedBook = await IssuedBook.create({
    schoolId,
    bookId,
    studentId: studentId || undefined,
    issuedToUserId: issuedToUserId || undefined,
    memberType: memberType || "Student",
    issueDate: issueDate ? new Date(issueDate) : new Date(),
    dueDate: computedDue,
    issuedBy: req.user._id,
    status: "Issued",
  });

  book.availableCopies -= 1;
  await book.save();

  const populated = await IssuedBook.findById(issuedBook._id)
    .populate("bookId", "title author isbn")
    .populate("schoolId", "name");

  res.status(201).json(new ApiResponse(201, populated, "Book issued successfully"));
});

// ── Get all issued books ──────────────────────────────────────────────────────
export const getAllIssuedBooks = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const filter = schoolId ? { schoolId } : {};

  // Auto-mark overdue
  await IssuedBook.updateMany(
    { ...filter, status: "Issued", dueDate: { $lt: new Date() } },
    { $set: { status: "Overdue" } }
  );

  const issuedBooks = await IssuedBook.find(filter)
    .populate("bookId", "title author isbn shelfLocation")
    .populate({
      path: "studentId",
      select: "userId",
      populate: { path: "userId", select: "name email" },
    })
    .populate("issuedToUserId", "name email")
    .populate("issuedBy", "name")
    .populate("schoolId", "name")
    .sort({ createdAt: -1 });

  const records = issuedBooks.map((r) => {
    const obj = r.toObject();
    // Normalise borrower name
    obj.borrowerName =
      obj.issuedToUserId?.name ||
      obj.studentId?.userId?.name ||
      obj.studentEmail ||
      "Unknown";
    obj.borrowerEmail =
      obj.issuedToUserId?.email ||
      obj.studentId?.userId?.email ||
      "";
    return obj;
  });

  res.status(200).json(new ApiResponse(200, records, "Issued books fetched"));
});

// ── Get issued books for a student (student-portal) ──────────────────────────
export const getIssuedBooksForStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ userId: req.user._id }).select("_id").lean();
  if (!student) {
    return res.status(200).json(new ApiResponse(200, [], "No student record found"));
  }

  const filter = { $or: [{ studentId: student._id }, { issuedToUserId: req.user._id }] };
  const issuedBooks = await IssuedBook.find(filter)
    .populate("bookId", "title author isbn")
    .populate("schoolId", "name");

  res.status(200).json(new ApiResponse(200, issuedBooks, "Issued books fetched"));
});

// ── Return a book ─────────────────────────────────────────────────────────────
export const returnBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status: newStatus } = req.body; // "Returned" | "Lost" | "Damaged"

  const issuedBook = await IssuedBook.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!issuedBook) throw new ApiError(404, "Issued book record not found");
  if (issuedBook.status === "Returned") throw new ApiError(400, "Book already returned");

  const schoolId = issuedBook.schoolId;
  const settings = await getSettings(schoolId);

  const returnDate = new Date();
  const finalStatus = ["Lost", "Damaged"].includes(newStatus) ? newStatus : "Returned";

  // Fine calculation
  let fine = 0;
  if (finalStatus === "Lost") {
    fine = settings.lostBookFine || 500;
  } else if (finalStatus === "Damaged") {
    fine = settings.damagedBookFine || 200;
  } else if (issuedBook.dueDate && returnDate > issuedBook.dueDate) {
    fine = calcFine(settings, issuedBook.dueDate, returnDate);
  }

  issuedBook.status     = finalStatus;
  issuedBook.returnDate = returnDate;
  issuedBook.fine       = fine;
  issuedBook.fineStatus = fine > 0 ? "Pending" : "Paid";
  await issuedBook.save();

  // Restore available copies only if book is physically returned
  if (finalStatus !== "Lost") {
    const book = await Book.findById(issuedBook.bookId);
    if (book) {
      book.availableCopies = Math.min(book.availableCopies + 1, book.totalCopies);
      await book.save();
    }
  }

  res.status(200).json(new ApiResponse(200, { ...issuedBook.toObject(), fine }, "Book return processed"));
});

// ── Collect / waive fine ──────────────────────────────────────────────────────
export const collectFine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action = "paid", note } = req.body; // "paid" | "waived"

  const issuedBook = await IssuedBook.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!issuedBook) throw new ApiError(404, "Record not found");
  if (issuedBook.fineStatus === "Paid") throw new ApiError(400, "Fine already collected");

  issuedBook.fineStatus = action === "waived" ? "Waived" : "Paid";
  if (note) issuedBook.fineNote = note;
  await issuedBook.save();

  res.status(200).json(new ApiResponse(200, issuedBook, `Fine ${issuedBook.fineStatus.toLowerCase()} successfully`));
});

// ── Delete issued record ──────────────────────────────────────────────────────
export const deleteIssuedBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await IssuedBook.findOne(buildSchoolAccessFilter(req, { _id: id }));
  if (!record) throw new ApiError(404, "Record not found");

  // If still issued, restore copy count
  if (record.status === "Issued" || record.status === "Overdue") {
    const book = await Book.findById(record.bookId);
    if (book) {
      book.availableCopies = Math.min(book.availableCopies + 1, book.totalCopies);
      await book.save();
    }
  }

  await record.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Record deleted"));
});

// ── Dashboard statistics ──────────────────────────────────────────────────────
export const getLibraryDashboard = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  // Auto-mark overdue first
  await IssuedBook.updateMany(
    { schoolId, status: "Issued", dueDate: { $lt: new Date() } },
    { $set: { status: "Overdue" } }
  );

  const memberRoles = await Role.find({ name: { $in: ["Teacher", "Staff", "Accountant", "HR"] } }).select("_id").lean();
  const memberRoleIds = memberRoles.map((r) => r._id);

  const [
    totalBooks,
    totalCopies,
    availableCopies,
    issuedCount,
    overdueCount,
    lostCount,
    pendingFines,
    recentActivity,
    topBooks,
    studentMemberCount,
    staffMemberCount,
  ] = await Promise.all([
    Book.countDocuments({ schoolId }),
    Book.aggregate([{ $match: { schoolId: new (await import("mongoose")).default.Types.ObjectId(schoolId) } }, { $group: { _id: null, total: { $sum: "$totalCopies" } } }]),
    Book.aggregate([{ $match: { schoolId: new (await import("mongoose")).default.Types.ObjectId(schoolId) } }, { $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
    IssuedBook.countDocuments({ schoolId, status: "Issued" }),
    IssuedBook.countDocuments({ schoolId, status: "Overdue" }),
    IssuedBook.countDocuments({ schoolId, status: "Lost" }),
    IssuedBook.aggregate([
      { $match: { schoolId: new (await import("mongoose")).default.Types.ObjectId(schoolId), fineStatus: "Pending", fine: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: "$fine" } } },
    ]),
    IssuedBook.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("bookId", "title")
      .populate("issuedToUserId", "name")
      .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name" } })
      .lean(),
    IssuedBook.aggregate([
      { $match: { schoolId: new (await import("mongoose")).default.Types.ObjectId(schoolId) } },
      { $group: { _id: "$bookId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
      { $unwind: "$book" },
      { $project: { title: "$book.title", count: 1 } },
    ]),
    Student.countDocuments({ schoolId, isActive: true }),
    User.countDocuments({ schoolId, isActive: true, isDeleted: { $ne: true }, roleId: { $in: memberRoleIds } }),
  ]);

  res.status(200).json(new ApiResponse(200, {
    totalBooks,
    totalCopies: totalCopies[0]?.total || 0,
    availableCopies: availableCopies[0]?.total || 0,
    issuedCount,
    overdueCount,
    lostCount,
    pendingFinesAmount: pendingFines[0]?.total || 0,
    totalMembers: studentMemberCount + staffMemberCount,
    recentActivity: recentActivity.map((r) => ({
      _id: r._id,
      bookTitle: r.bookId?.title || "Unknown",
      borrower: r.issuedToUserId?.name || r.studentId?.userId?.name || "Unknown",
      status: r.status,
      issueDate: r.issueDate,
      dueDate: r.dueDate,
      fine: r.fine,
    })),
    topBorrowedBooks: topBooks,
  }, "Dashboard data fetched"));
});

// ── Get overdue books ─────────────────────────────────────────────────────────
export const getOverdueBooks = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);

  await IssuedBook.updateMany(
    { schoolId, status: "Issued", dueDate: { $lt: new Date() } },
    { $set: { status: "Overdue" } }
  );

  const records = await IssuedBook.find({ schoolId, status: "Overdue" })
    .populate("bookId", "title author isbn")
    .populate("issuedToUserId", "name email")
    .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
    .sort({ dueDate: 1 });

  const settings = await getSettings(schoolId);

  const enriched = records.map((r) => {
    const obj = r.toObject();
    const overdueDays = Math.max(0, Math.ceil((new Date() - new Date(r.dueDate)) / 86400000));
    obj.overdueDays = overdueDays;
    obj.estimatedFine = calcFine(settings, r.dueDate, new Date());
    obj.borrowerName = obj.issuedToUserId?.name || obj.studentId?.userId?.name || "Unknown";
    return obj;
  });

  res.status(200).json(new ApiResponse(200, enriched, "Overdue books fetched"));
});

// ── Fine summary ──────────────────────────────────────────────────────────────
export const getFineSummary = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);

  const records = await IssuedBook.find({ schoolId, fine: { $gt: 0 } })
    .populate("bookId", "title")
    .populate("issuedToUserId", "name email")
    .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name email" } })
    .sort({ createdAt: -1 });

  const enriched = records.map((r) => ({
    ...r.toObject(),
    borrowerName: r.issuedToUserId?.name || r.studentId?.userId?.name || "Unknown",
    borrowerEmail: r.issuedToUserId?.email || r.studentId?.userId?.email || "",
  }));

  const totalPending   = enriched.filter((r) => r.fineStatus === "Pending").reduce((s, r) => s + r.fine, 0);
  const totalCollected = enriched.filter((r) => r.fineStatus === "Paid").reduce((s, r) => s + r.fine, 0);
  const totalWaived    = enriched.filter((r) => r.fineStatus === "Waived").reduce((s, r) => s + r.fine, 0);

  res.status(200).json(new ApiResponse(200, {
    records: enriched,
    summary: { totalPending, totalCollected, totalWaived },
  }, "Fine summary fetched"));
});

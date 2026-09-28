import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { LibraryCard, LIBRARY_CARD_HOLDER_TYPES } from "../models/LibraryCard.model.js";
import { Student } from "../models/student.model.js";
import { Employee } from "../models/Employee.model.js";
import { User } from "../models/user.model.js";
import { School } from "../models/school.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { generateNextCardNumber } from "../utils/generateCardNumber.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { requireSchoolId } from "../utils/resolveSchoolId.js";

const CARD_PREFIX = "LIB";

// A card is valid through its expiry day, and "today" is the school's day (server runs on IST).
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const withComputedStatus = (card, today = startOfToday()) => ({
  ...card,
  displayStatus:
    card.status === "Revoked" ? "Revoked" : new Date(card.expiryDate) < today ? "Expired" : "Active",
});

const buildCardNumber = async (schoolId) => {
  const lastCard = await LibraryCard.findOne({ schoolId, cardNumber: new RegExp(`^${CARD_PREFIX}/`) })
    .sort({ createdAt: -1 })
    .select("cardNumber")
    .lean();
  return generateNextCardNumber(lastCard?.cardNumber, { prefix: CARD_PREFIX, digits: 4 });
};

// Latest enrolment per student — the active year first, falling back to the most recent one.
const enrollmentsFor = async (schoolId, studentIds) => {
  if (!studentIds.length) return new Map();
  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();
  const rows = await StudentEnrollment.find({ schoolId, studentId: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .lean();
  const byStudent = new Map();
  for (const row of rows) {
    const key = String(row.studentId);
    const current = byStudent.get(key);
    const inActiveYear = school?.activeAcademicYearId && String(row.academicYearId) === String(school.activeAcademicYearId);
    if (!current || (inActiveYear && !current.inActiveYear)) byStudent.set(key, { ...row, inActiveYear });
  }
  return byStudent;
};

// Loads a holder of this school, active, with the details printed on the card. Never trusts a
// name or class typed into the form — the old page did, and a card could say anything.
const loadHolder = async (schoolId, holderType, holderId) => {
  if (holderType === "Student") {
    const student = await Student.findOne({ _id: holderId, schoolId })
      .populate("userId", "name")
      .lean();
    if (!student) throw new ApiError(404, "Student not found in this school");
    if (student.status !== "active" || student.isActive === false) {
      throw new ApiError(400, "Only active students can be given a library card");
    }
    const enrollment = (await enrollmentsFor(schoolId, [student._id])).get(String(student._id));
    return {
      userId: student.userId?._id || null,
      fullName: student.userId?.name || "",
      className: enrollment?.schoolClassId?.name || "",
      sectionName: enrollment?.sectionId?.name || "",
      registrationNumber: enrollment?.registrationNumber || "",
    };
  }

  const employee = await Employee.findOne({ _id: holderId, schoolId }).populate("userId", "name").lean();
  if (!employee) throw new ApiError(404, "Staff member not found in this school");
  if (employee.isActive === false) throw new ApiError(400, "Only active staff can be given a library card");
  return {
    userId: employee.userId?._id || null,
    fullName: employee.userId?.name || "",
    designation: employee.designation || "",
    employeeCode: employee.employeeCode || "",
  };
};

/** GET /library-cards?status=active|expired|revoked&holderType=&search= */
export const getLibraryCards = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { status, holderType, search } = req.query;
  const today = startOfToday();

  const filter = { schoolId };
  if (holderType && LIBRARY_CARD_HOLDER_TYPES.includes(holderType)) filter.holderType = holderType;
  if (status === "revoked") filter.status = "Revoked";
  else if (status === "expired") Object.assign(filter, { status: "Active", expiryDate: { $lt: today } });
  else if (status === "active") Object.assign(filter, { status: "Active", expiryDate: { $gte: today } });
  if (search?.trim()) {
    const term = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ fullName: term }, { cardNumber: term }, { registrationNumber: term }, { employeeCode: term }];
  }

  const [cards, counts] = await Promise.all([
    LibraryCard.find(filter).sort({ createdAt: -1 }).limit(500).lean(),
    LibraryCard.aggregate([
      { $match: { schoolId: filter.schoolId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          revoked: { $sum: { $cond: [{ $eq: ["$status", "Revoked"] }, 1, 0] } },
          expired: {
            $sum: { $cond: [{ $and: [{ $eq: ["$status", "Active"] }, { $lt: ["$expiryDate", today] }] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const c = counts[0] || { total: 0, revoked: 0, expired: 0 };
  return res.status(200).json(
    new ApiResponse(200, {
      cards: cards.map((card) => withComputedStatus(card, today)),
      summary: { total: c.total, active: c.total - c.revoked - c.expired, expired: c.expired, revoked: c.revoked },
    }, "Library cards fetched")
  );
});

/**
 * GET /library-cards/candidates?holderType=Student|Employee&search=
 * Active students or staff of this school who do not already hold an active card.
 */
export const getCardCandidates = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const holderType = req.query.holderType === "Employee" ? "Employee" : "Student";
  const search = req.query.search?.trim();

  // Someone whose card has expired is due a new one, so only cards still in date count here.
  const holding = await LibraryCard.find({
    schoolId, holderType, status: "Active", expiryDate: { $gte: startOfToday() },
  }).distinct("holderId");
  const filter = { schoolId, _id: { $nin: holding } };
  if (holderType === "Student") Object.assign(filter, { status: "active", isActive: { $ne: false } });
  else filter.isActive = { $ne: false };

  if (search) {
    const users = await User.find({ name: new RegExp(escapeRegex(search), "i") }).select("_id").limit(200).lean();
    filter.userId = { $in: users.map((u) => u._id) };
  }

  const Model = holderType === "Student" ? Student : Employee;
  const rows = await Model.find(filter).populate("userId", "name").limit(20).lean();

  let enrollments = new Map();
  if (holderType === "Student") enrollments = await enrollmentsFor(schoolId, rows.map((r) => r._id));

  const candidates = rows
    .filter((r) => r.userId?.name)
    .map((r) => {
      if (holderType === "Student") {
        const e = enrollments.get(String(r._id));
        const cls = [e?.schoolClassId?.name, e?.sectionId?.name].filter(Boolean).join(" - ");
        return { holderId: r._id, fullName: r.userId.name, detail: cls || "No class yet" };
      }
      return { holderId: r._id, fullName: r.userId.name, detail: r.designation || r.employeeCode || "Staff" };
    });

  return res.status(200).json(new ApiResponse(200, candidates, "Candidates fetched"));
});

/** POST /library-cards  { holderType, holderId, expiryDate: "YYYY-MM-DD" } */
export const issueLibraryCard = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);
  const { holderType, holderId, expiryDate } = req.body;

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) throw new ApiError(400, "A valid expiry date is required");
  if (expiry < startOfToday()) throw new ApiError(400, "Expiry date cannot be in the past");

  const snapshot = await loadHolder(schoolId, holderType, holderId);

  // Renewal: an expired card would otherwise still count as this person's one active card and
  // block the new one. It is closed off (kept on file) rather than left for someone to revoke.
  await LibraryCard.updateMany(
    { schoolId, holderType, holderId, status: "Active", expiryDate: { $lt: startOfToday() } },
    {
      $set: {
        status: "Revoked",
        revokedAt: new Date(),
        revokedBy: req.user._id,
        revokeReason: "Expired — replaced by a new card",
      },
    }
  );

  let card;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cardNumber = await buildCardNumber(schoolId);
    try {
      card = await LibraryCard.create({
        ...snapshot,
        schoolId,
        holderType,
        holderId,
        cardNumber,
        expiryDate: expiry,
        issuedBy: req.user._id,
      });
      break;
    } catch (err) {
      if (err?.code !== 11000) throw err;
      // Which unique index refused it decides what to do next.
      if (err.keyPattern?.holderId || String(err.message).includes("one_active_card_per_holder")) {
        throw new ApiError(409, `${snapshot.fullName} already has an active library card`);
      }
      if (attempt === 2) throw new ApiError(409, "Could not allocate a card number, please try again");
    }
  }

  return res.status(201).json(new ApiResponse(201, withComputedStatus(card.toObject()), "Library card issued"));
});

/** PATCH /library-cards/:id/revoke  { reason? } */
export const revokeLibraryCard = asyncHandler(async (req, res) => {
  const schoolId = requireSchoolId(req.user);

  // Conditional update, so revoking twice (or two admins at once) cannot overwrite who revoked it.
  const card = await LibraryCard.findOneAndUpdate(
    { _id: req.params.id, schoolId, status: "Active" },
    {
      $set: {
        status: "Revoked",
        revokedAt: new Date(),
        revokedBy: req.user._id,
        revokeReason: String(req.body?.reason || "").trim().slice(0, 300),
      },
    },
    { new: true }
  ).lean();

  if (!card) {
    const exists = await LibraryCard.exists({ _id: req.params.id, schoolId });
    throw new ApiError(exists ? 400 : 404, exists ? "This card is already revoked" : "Library card not found");
  }

  return res.status(200).json(new ApiResponse(200, withComputedStatus(card), "Library card revoked"));
});

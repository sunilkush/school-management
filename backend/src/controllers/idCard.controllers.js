import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { IDCard, ID_CARD_HOLDER_TYPES } from "../models/IDCard.model.js";
import { Student } from "../models/student.model.js";
import { Employee } from "../models/Employee.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { School } from "../models/school.model.js";
import { exportIdCardsPdf } from "../utils/exportService.js";
import { generateNextCardNumber, getCardPrefix } from "../utils/generateCardNumber.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const ensureIdCardAccess = (doc, user) => {
  if (!doc) throw new ApiError(404, "ID card not found");
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school ID card");
  }
};

const resolveStudentEnrollment = async (studentId, schoolId, activeAcademicYearId) => {
  let enrollment = null;
  if (activeAcademicYearId) {
    enrollment = await StudentEnrollment.findOne({ studentId, schoolId, academicYearId: activeAcademicYearId })
      .sort({ createdAt: -1 })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .lean();
  }
  if (!enrollment) {
    enrollment = await StudentEnrollment.findOne({ studentId, schoolId })
      .sort({ createdAt: -1 })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .lean();
  }
  return enrollment;
};

const buildStudentSnapshot = (student, enrollment) => ({
  userId: student.userId?._id || null,
  fullName: student.userId?.name || "",
  photoUrl: student.picture || student.userId?.avatar || "",
  bloodGroup: student.bloodGroup || "",
  contactPhone: student.fatherInfo?.mobile || student.motherInfo?.mobile || "",
  address: student.address || "",
  className: enrollment?.schoolClassId?.name || "",
  sectionName: enrollment?.sectionId?.name || "",
  rollNumber: enrollment?.rollNumber != null ? String(enrollment.rollNumber) : "",
  registrationNumber: enrollment?.registrationNumber || "",
});

const buildEmployeeSnapshot = (employee) => ({
  userId: employee.userId?._id || null,
  fullName: employee.userId?.name || "",
  photoUrl: employee.userId?.avatar || "",
  bloodGroup: employee.bloodType || "",
  contactPhone: employee.phoneNo || "",
  address: [employee.address?.street, employee.address?.city, employee.address?.state]
    .filter(Boolean)
    .join(", "),
  designation: employee.designation || "",
  department: employee.department || "",
  employeeCode: employee.employeeCode || "",
});

// Resolves the calling Student/Parent to the set of Student._id's they're allowed to see —
// their own record for a Student, or their linked children for a Parent. Used only by the /my
// self-service endpoints; admin endpoints scope by schoolId, not by holder identity.
const resolveMyStudentIds = async (req) => {
  const roleName = req.user.roleId?.name;
  if (roleName === "Student") {
    const student = await Student.findOne({ userId: req.user._id }).select("_id").lean();
    return student ? [student._id] : [];
  }
  if (roleName === "Parent") {
    const children = await Student.find({
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    }).select("_id").lean();
    return children.map((c) => c._id);
  }
  return [];
};

const buildCardNumber = async (schoolId, holderType) => {
  const prefix = getCardPrefix(holderType);
  const year = new Date().getFullYear();

  const lastCard = await IDCard.findOne({ schoolId, holderType })
    .sort({ createdAt: -1 })
    .select("cardNumber")
    .lean();

  return generateNextCardNumber(lastCard?.cardNumber, { prefix, year, digits: 4 });
};

// Shared by the manual /generate endpoint below and by the auto-issue hooks called from
// student admission and promotion — builds a fresh snapshot and a unique card number,
// retrying once on a cardNumber collision (same race-safety as generateIdCard/generateBulkIdCards).
const createStudentIdCardDoc = async ({ schoolId, studentId, generatedBy = null, validUntil = null }) => {
  const student = await Student.findById(studentId).populate("userId", "name avatar").lean();
  if (!student) return null;

  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();
  const enrollment = await resolveStudentEnrollment(studentId, schoolId, school?.activeAcademicYearId);
  const snapshot = buildStudentSnapshot(student, enrollment);

  let card;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const cardNumber = await buildCardNumber(schoolId, "Student");
    try {
      [card] = await IDCard.create([
        {
          ...snapshot,
          schoolId,
          holderType: "Student",
          holderId: studentId,
          cardNumber,
          validUntil,
          generatedBy,
        },
      ]);
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) continue;
      throw error;
    }
  }
  return card;
};

// Called right after a new admission commits. Best-effort by design — the caller must swallow
// errors from this so a card-service hiccup never fails the admission itself.
export const issueStudentIdCard = async ({ schoolId, studentId, generatedBy = null }) =>
  createStudentIdCardDoc({ schoolId, studentId, generatedBy });

// Called right after promotion commits. The student's className/sectionName/rollNumber snapshot
// on their previous card is now stale, so retire it and issue a fresh one rather than leaving a
// card in circulation that shows last year's class. Best-effort — same contract as above.
export const reissueStudentIdCardOnPromotion = async ({ schoolId, studentId, generatedBy = null }) => {
  await IDCard.updateMany(
    { schoolId, holderType: "Student", holderId: studentId, status: "Active" },
    {
      $set: {
        status: "Inactive",
        deactivatedAt: new Date(),
        deactivatedBy: generatedBy,
        deactivateReason: "Promoted to next class",
      },
    }
  );
  return createStudentIdCardDoc({ schoolId, studentId, generatedBy });
};

export const generateIdCard = asyncHandler(async (req, res) => {
  const { holderType, holderId, validUntil } = req.body;

  if (!ID_CARD_HOLDER_TYPES.includes(holderType)) {
    throw new ApiError(400, "Invalid holder type");
  }

  let snapshot;
  let schoolId;

  if (holderType === "Student") {
    const student = await Student.findById(holderId).populate("userId", "name avatar").lean();
    if (!student) throw new ApiError(404, "Student not found");
    schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
    if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

    const school = await School.findById(schoolId).select("activeAcademicYearId").lean();
    const enrollment = await resolveStudentEnrollment(holderId, schoolId, school?.activeAcademicYearId);
    snapshot = buildStudentSnapshot(student, enrollment);
  } else {
    const employee = await Employee.findById(holderId).populate("userId", "name avatar").lean();
    if (!employee) throw new ApiError(404, "Employee not found");
    schoolId = req.user.roleId?.name === "Super Admin" ? employee.schoolId : req.user.schoolId;
    if (`${employee.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school employee");

    snapshot = buildEmployeeSnapshot(employee);
  }

  let card;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const cardNumber = await buildCardNumber(schoolId, holderType);
    try {
      card = await IDCard.create({
        ...snapshot,
        schoolId,
        holderType,
        holderId,
        cardNumber,
        validUntil: validUntil || null,
        generatedBy: req.user._id,
      });
      break;
    } catch (error) {
      if (error?.code === 11000 && attempt === 0) continue;
      throw error;
    }
  }

  return res.status(201).json(new ApiResponse(201, card, "ID card generated successfully"));
});

export const generateBulkIdCards = asyncHandler(async (req, res) => {
  const { holderType, schoolClassId, sectionId, department, validUntil, force } = req.body;

  if (!ID_CARD_HOLDER_TYPES.includes(holderType)) {
    throw new ApiError(400, "Invalid holder type");
  }

  const schoolId = req.user.roleId?.name === "Super Admin" ? req.body.schoolId || req.user.schoolId : req.user.schoolId;
  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();

  let holders = []; // [{ holderId, snapshot }]

  if (holderType === "Student") {
    if (!schoolClassId || !sectionId) {
      throw new ApiError(400, "schoolClassId and sectionId are required to bulk-generate student ID cards");
    }
    const enrollmentFilter = {
      schoolId,
      schoolClassId,
      sectionId,
      status: "Active",
      ...(school?.activeAcademicYearId ? { academicYearId: school.activeAcademicYearId } : {}),
    };
    const enrollments = await StudentEnrollment.find(enrollmentFilter)
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .lean();

    const studentIds = enrollments.map((e) => e.studentId);
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate("userId", "name avatar")
      .lean();
    const studentMap = new Map(students.map((s) => [`${s._id}`, s]));

    holders = enrollments
      .filter((e) => studentMap.has(`${e.studentId}`))
      .map((e) => ({
        holderId: e.studentId,
        snapshot: buildStudentSnapshot(studentMap.get(`${e.studentId}`), e),
      }));
  } else {
    const filter = { schoolId, isActive: true, ...(department && { department }) };
    const employees = await Employee.find(filter).populate("userId", "name avatar").lean();
    holders = employees.map((emp) => ({ holderId: emp._id, snapshot: buildEmployeeSnapshot(emp) }));
  }

  if (!holders.length) {
    throw new ApiError(400, "No matching students/staff found to generate ID cards for");
  }

  let targetHolders = holders;
  if (!force) {
    const existing = await IDCard.find({
      schoolId,
      holderType,
      holderId: { $in: holders.map((h) => h.holderId) },
      status: "Active",
    })
      .select("holderId")
      .lean();
    const existingIds = new Set(existing.map((c) => `${c.holderId}`));
    targetHolders = holders.filter((h) => !existingIds.has(`${h.holderId}`));
  }

  const skippedCount = holders.length - targetHolders.length;
  if (!targetHolders.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, { cards: [], skippedCount }, "All selected holders already have an active ID card"));
  }

  const prefix = getCardPrefix(holderType);
  const year = new Date().getFullYear();
  const lastCard = await IDCard.findOne({ schoolId, holderType })
    .sort({ createdAt: -1 })
    .select("cardNumber")
    .lean();

  let baseNumber = 0;
  if (lastCard?.cardNumber) {
    const match = lastCard.cardNumber.match(new RegExp(`^${prefix}/${year}/(\\d+)$`));
    if (match) baseNumber = parseInt(match[1], 10);
  }

  const payloads = targetHolders.map((h, index) => ({
    ...h.snapshot,
    schoolId,
    holderType,
    holderId: h.holderId,
    cardNumber: `${prefix}/${year}/${String(baseNumber + index + 1).padStart(4, "0")}`,
    validUntil: validUntil || null,
    generatedBy: req.user._id,
  }));

  const cards = await IDCard.insertMany(payloads, { ordered: true });

  return res
    .status(201)
    .json(new ApiResponse(201, { cards, skippedCount }, "ID cards generated successfully"));
});

export const getIdCards = asyncHandler(async (req, res) => {
  const isSuperAdmin = req.user.roleId?.name === "Super Admin";
  const schoolId = isSuperAdmin ? req.query.schoolId || req.user.schoolId : req.user.schoolId;

  const { holderType, status, search, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (holderType) filter.holderType = holderType;
  if (status) filter.status = status;
  if (search) {
    const regex = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ cardNumber: regex }, { fullName: regex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-createdAt";

  const [cards, total] = await Promise.all([
    IDCard.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    IDCard.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      cards,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "ID cards fetched successfully")
  );
});

export const getIdCardById = asyncHandler(async (req, res) => {
  const card = await IDCard.findById(req.params.id).lean();
  ensureIdCardAccess(card, req.user);

  return res.status(200).json(new ApiResponse(200, card, "ID card fetched successfully"));
});

export const deactivateIdCard = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const card = await IDCard.findById(req.params.id);
  ensureIdCardAccess(card, req.user);

  if (card.status === "Inactive") {
    throw new ApiError(400, "ID card already inactive");
  }

  card.status = "Inactive";
  card.deactivatedAt = new Date();
  card.deactivatedBy = req.user._id;
  card.deactivateReason = reason || "";
  await card.save();

  return res.status(200).json(new ApiResponse(200, card, "ID card deactivated successfully"));
});

export const downloadIdCardsPdf = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    throw new ApiError(400, "body.ids must be a non-empty array of ID card ids");
  }

  const cards = await IDCard.find({ _id: { $in: ids } }).lean();
  if (!cards.length) throw new ApiError(404, "No ID cards found for the given ids");

  cards.forEach((card) => ensureIdCardAccess(card, req.user));

  const schoolId = cards[0].schoolId;
  const school = await School.findById(schoolId).select("name logo").lean();

  const pdfBuffer = await exportIdCardsPdf(cards, school);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="id-cards-${Date.now()}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer);
});

/* ══════════════════════ Student/Parent self-service ══════════════════════ */

export const getMyIdCards = asyncHandler(async (req, res) => {
  const studentIds = await resolveMyStudentIds(req);
  if (!studentIds.length) {
    return res.status(200).json(new ApiResponse(200, [], "No ID cards found"));
  }

  const cards = await IDCard.find({ holderType: "Student", holderId: { $in: studentIds } })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, cards, "ID cards fetched successfully"));
});

export const downloadMyIdCardPdf = asyncHandler(async (req, res) => {
  const studentIds = await resolveMyStudentIds(req);
  const card = await IDCard.findOne({
    _id: req.params.id,
    holderType: "Student",
    holderId: { $in: studentIds },
  }).lean();

  if (!card) throw new ApiError(404, "ID card not found");

  const school = await School.findById(card.schoolId).select("name logo").lean();
  const pdfBuffer = await exportIdCardsPdf([card], school);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${card.cardNumber.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf"`);
  res.setHeader("Content-Length", pdfBuffer.length);
  return res.end(pdfBuffer);
});

/* ══════════════════════ Public verification (no auth) ══════════════════════ */
// Deliberately minimal payload — this route is intentionally exempt from the auth wall
// (see PUBLIC_API_ROUTE_PATTERNS in auth.middleware.js), so it must never return contact/address
// fields the authenticated endpoints above do.

export const verifyIdCard = asyncHandler(async (req, res) => {
  const card = await IDCard.findOne({
    cardNumber: req.params.cardNumber.toUpperCase(),
  }).lean();

  if (!card) {
    return res.status(200).json(new ApiResponse(200, { valid: false }, "ID card not found"));
  }

  const school = await School.findById(card.schoolId).select("name").lean();
  const roleLine = card.holderType === "Student"
    ? [card.className, card.sectionName].filter(Boolean).join(" - ")
    : (card.designation || card.department || "");

  return res.status(200).json(new ApiResponse(200, {
    valid: card.status === "Active",
    holderType: card.holderType,
    fullName: card.fullName,
    photoUrl: card.photoUrl,
    cardNumber: card.cardNumber,
    roleLine,
    validUntil: card.validUntil,
    status: card.status,
    schoolName: school?.name || "",
  }, "ID card verification result"));
});

import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Exam } from "../models/Exam.model.js";
import { ExamClass } from "../models/ExamClass.model.js";
import { Marks } from "../models/Marks.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Section } from "../models/section.model.js";
import { ExamAttempt } from "../models/ExamAttempts.model.js";
import { getGradeBands, resolveGrade } from "./gradingScale.service.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { actingRoleName } from "../utils/actingRole.js";

const OBJECT_ID = mongoose.Types.ObjectId;

// Student/Parent scoping below branches on actingRoleName, not the primary role: the exam routes
// admit additional roles, so a Librarian holding "Parent" as an additional role got in on it,
// matched no primary-role branch, and was scoped like staff — every exam in the school, drafts
// included. Broadest first; mirrors the role lists in routes/exam.routes.js.
const EXAM_STAFF_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal", "Exam Coordinator", "Subject Coordinator", "Teacher"];
const EXAM_SCOPE_ROLES = [...EXAM_STAFF_ROLES, "Accountant", "Staff", "Support Staff", "Student", "Parent"];
const examScopeRole = (user) => {
  const role = actingRoleName(user, EXAM_SCOPE_ROLES);
  if (!role) throw new ApiError(403, "Forbidden. Insufficient role access.");
  return role;
};
// With no year named, the enrollment in the school's active year — not simply the newest one,
// which for a child promoted ahead of time is next year's class.
const currentEnrollment = async ({ status, ...rest }) => {
  // Active anywhere, or already marked Promoted — the active-year pick below decides between them.
  const query = status === "Active" ? { ...rest, status: { $in: ["Active", "Promoted"] } } : { ...rest, status };
  const rows = await StudentEnrollment.find(query)
    .sort({ createdAt: -1 })
    .select("schoolId academicYearId schoolClassId sectionId status")
    .lean();
  if (!rows.length) return null;
  const activeYear = await AcademicYear.findOne({ schoolId: rows[0].schoolId, $or: [{ isActive: true }, { status: "active" }] }).select("_id").lean();
  return rows.find((r) => String(r.academicYearId) === String(activeYear?._id))
    || rows.find((r) => r.status === "Active")
    // A year was named: whatever the student's enrollment in it is.
    || (rest.academicYearId ? rows[0] : null);
};

const getActiveEnrollmentForStudentUser = async ({ userId, academicYearId }) => {
  const student = await Student.findOne({ userId }).select("_id").lean();
  if (!student) return null;

  const enrollmentQuery = { studentId: student._id, status: "Active" };
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    enrollmentQuery.academicYearId = academicYearId;
  }
  return currentEnrollment(enrollmentQuery);
};

const getParentChildEnrollment = async ({ parentId, studentUserId, academicYearId }) => {
  const childQuery = {
    $or: [{ fatherId: parentId }, { motherId: parentId }, { guardianId: parentId }],
  };
  if (studentUserId && mongoose.Types.ObjectId.isValid(studentUserId)) {
    childQuery.userId = studentUserId;
  }

  const child = await Student.findOne(childQuery).select("_id userId").lean();
  if (!child) return null;

  const enrollmentQuery = { studentId: child._id, status: "Active" };
  if (academicYearId && mongoose.Types.ObjectId.isValid(academicYearId)) {
    enrollmentQuery.academicYearId = academicYearId;
  }
  return currentEnrollment(enrollmentQuery);
};

const normalizeExamPayload = (payload = {}) => ({
  ...payload,
  title: payload.name || payload.title,
  examCode: payload.examCode ? String(payload.examCode).trim().toUpperCase() : undefined,
  totalMarks: payload.totalMarks !== undefined ? Number(payload.totalMarks) : payload.totalMarks,
  passingMarks: payload.passingMarks !== undefined ? Number(payload.passingMarks) : payload.passingMarks,
  durationMinutes:
    payload.durationMinutes !== undefined ? Number(payload.durationMinutes) : payload.durationMinutes,
  settings: {
    negativeMarking: Number(payload?.settings?.negativeMarking || 0),
    allowPartialScoring: Boolean(payload?.settings?.allowPartialScoring || false),
    maxAttempts: Math.max(Number(payload?.settings?.maxAttempts || 1), 1),
  },
});

const validateExamPayload = (payload) => {
  if (!payload.title || !payload.schoolClassId || !payload.subjectId || !payload.examDate) {
    throw new ApiError(400, "name/title, schoolClassId, subjectId and examDate are required");
  }

  if (!payload.totalMarks || payload.passingMarks === undefined) {
    throw new ApiError(400, "totalMarks and passingMarks are required");
  }

  if (!payload.startTime || !payload.endTime || !payload.durationMinutes) {
    throw new ApiError(400, "startTime, endTime and durationMinutes are required");
  }

  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(400, "Invalid startTime or endTime");
  }
  if (endTime <= startTime) {
    throw new ApiError(400, "End time must be after start time");
  }

  if (Number(payload.passingMarks) > Number(payload.totalMarks)) {
    throw new ApiError(400, "Passing marks cannot exceed total marks");
  }
};

const resolveScope = async ({ user, studentId }) => {
  const role = examScopeRole(user);
  if (role === "Student") {
    return { studentId: user._id };
  }

  if (role === "Parent") {
    const query = { $or: [{ fatherId: user._id }, { motherId: user._id }, { guardianId: user._id }] };
    if (studentId) query.userId = new OBJECT_ID(studentId);

    const child = await Student.findOne(query)
      .populate({ path: "userId", select: "schoolId" })
      .select("userId")
      .lean();
    if (!child) throw new ApiError(404, "Child not found for this parent");
    if (`${child.userId?.schoolId}` !== `${user.schoolId}`) {
      throw new ApiError(403, "Forbidden to access child outside your school");
    }
    return { studentId: child.userId?._id || child.userId };
  }

  // Staff roles (Teacher, School Admin, Principal, Exam Coordinator, ...) reach here with an
  // arbitrary :studentId from the route param. Without pinning schoolId too, any staff member
  // in ANY school could pull another school's student's exam results just by knowing/guessing
  // their user id — ExamResult always carries its own schoolId, so scoping by it here is enough
  // to keep this staff-only branch tenant-safe (Super Admin is intentionally left unscoped).
  if (!studentId) throw new ApiError(400, "studentId is required");
  const scope = { studentId: new OBJECT_ID(studentId) };
  if (user?.roleId?.name !== "Super Admin") {
    scope.schoolId = user?.schoolId?._id || user?.schoolId;
  }
  return scope;
};

export const createExamService = async ({ body, user }) => {
  const generatedCode = body.examCode || `EX-${Date.now().toString().slice(-8)}`;
  const payload = normalizeExamPayload({
    ...body,
    examCode: generatedCode,
    createdBy: user._id,
    schoolId: user.roleId?.name === "Super Admin" ? body.schoolId : user.schoolId,
  });

  validateExamPayload(payload);

  const duplicateExam = await Exam.findOne({
    schoolId: payload.schoolId,
    academicYearId: payload.academicYearId,
    schoolClassId: payload.schoolClassId,
    subjectId: payload.subjectId,
    examDate: new Date(payload.examDate),
    title: payload.title,
  })
    .select("_id")
    .lean();

  if (duplicateExam) {
    throw new ApiError(409, "An exam with the same title, class, subject, and examDate already exists");
  }

  const exam = await Exam.create(payload);
 
  return exam;
};

export const getExamsService = async ({ query, user }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  // Most exam screens load the year's exams once and filter them themselves; a 100 cap cut a
  // school with many classes short. ExamPage still pages with its own small limit.
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 2000);
  const skip = (page - 1) * limit;

  const filters = {};
  if (user.roleId?.name !== "Super Admin") filters.schoolId = user.schoolId;
  if (query.schoolId && user.roleId?.name === "Super Admin") filters.schoolId = query.schoolId;
  if (query.academicYearId) filters.academicYearId = query.academicYearId;
  if (query.schoolClassId) filters.schoolClassId = query.schoolClassId;
  if (query.sectionId) filters.sectionId = query.sectionId;
  if (query.subjectId) filters.subjectId = query.subjectId;
  if (query.status) filters.status = query.status;

  // Every other search in the codebase escapes its input; this one did not. The raw term went into
  // $regex, so a search like `(a+)+$` could backtrack catastrophically and stall the event loop for
  // every request, and `.` or `*` silently matched things the user never typed. A repeated query
  // param (`?search=a&search=b`) also arrives as an array, and `.trim()` on it threw — a 500 for
  // what is just bad input. Only a string is searched.
  if (typeof query.search === "string" && query.search.trim()) {
    const searchTerm = escapeRegex(query.search.trim());
    filters.$or = [
      { title: { $regex: searchTerm, $options: "i" } },
      { examCode: { $regex: searchTerm, $options: "i" } },
    ];
  }

  const role = examScopeRole(user);
  if (role === "Student") {
    const enrollment = await getActiveEnrollmentForStudentUser({
      userId: user._id,
      academicYearId: query.academicYearId,
    });

    filters.status = "published";
    if (enrollment) {
      filters.schoolId = enrollment.schoolId;
      filters.academicYearId = enrollment.academicYearId;
      filters.schoolClassId = enrollment.schoolClassId;
      filters.$or = [
        { sectionId: enrollment.sectionId },
        { sectionId: null },
        { sectionId: { $exists: false } },
      ];
    } else {
      filters._id = { $exists: false };
    }
  }

  if (role === "Parent") {
    const enrollment = await getParentChildEnrollment({
      parentId: user._id,
      studentUserId: query.studentId,
      academicYearId: query.academicYearId,
    });

    filters.status = "published";
    if (enrollment) {
      filters.schoolId = enrollment.schoolId;
      filters.academicYearId = enrollment.academicYearId;
      filters.schoolClassId = enrollment.schoolClassId;
      filters.$or = [
        { sectionId: enrollment.sectionId },
        { sectionId: null },
        { sectionId: { $exists: false } },
      ];
    } else {
      filters._id = { $exists: false };
    }
  }

  const sortField = ["examDate", "totalMarks", "createdAt"].includes(query.sortBy)
    ? query.sortBy
    : "examDate";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [total, exams] = await Promise.all([
    Exam.countDocuments(filters),
    Exam.find(filters)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name")
      .lean(),
  ]);

  return {
    exams,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

// A Teacher changes only exams they created — the rule for editing, deleting and assigning one.
// Entering and finalising its marks and publishing its results are changing it too: without this,
// any teacher could enter or overwrite marks on a colleague's exam and publish the results.
const assertTeacherOwnsExam = async (user, examOrId) => {
  if (actingRoleName(user, EXAM_STAFF_ROLES) !== "Teacher") return;
  const exam = examOrId?.createdBy !== undefined ? examOrId : await Exam.findById(examOrId).select("createdBy").lean();
  if (!exam || `${exam.createdBy}` !== `${user._id}`) {
    throw new ApiError(403, "Teachers can change only exams they created");
  }
};

/**
 * Whose marks a staff member may enter for an exam. The exam's creator, and every exam role above
 * Teacher, may mark the whole class. Any other Teacher may mark the students of the sections where
 * they teach the exam's subject or are the class teacher. This used to be creator-only, so a subject
 * teacher could not enter marks for an exam the office had set, which is how most exams are set.
 * Changing the exam itself (edit, delete, class) stays with its creator.
 */
const markingScope = async (user, exam) => {
  if (actingRoleName(user, EXAM_STAFF_ROLES) !== "Teacher" || `${exam.createdBy}` === `${user._id}`) {
    return { all: true, sectionIds: null };
  }
  const sections = await Section.find({
    schoolId: exam.schoolId,
    academicYearId: exam.academicYearId,
    schoolClassId: exam.schoolClassId,
    ...(exam.sectionId ? { _id: exam.sectionId } : {}),
    $or: [
      { classTeacherId: user._id },
      { subjects: { $elemMatch: { subjectId: exam.subjectId, teacherId: user._id } } },
    ],
  }).select("_id").lean();
  if (!sections.length) {
    throw new ApiError(403, "You can enter marks only for exams you created, or for a subject you teach (or a section you are class teacher of)");
  }
  return { all: false, sectionIds: sections.map((s) => s._id) };
};

// The enrolled students a scope covers (Student doc ids and their user ids).
const scopedEnrollments = (exam, scope, extra = {}) => StudentEnrollment.find({
  schoolId: exam.schoolId,
  academicYearId: exam.academicYearId,
  schoolClassId: exam.schoolClassId,
  ...(exam.sectionId ? { sectionId: exam.sectionId } : {}),
  ...(scope.all ? {} : { sectionId: { $in: scope.sectionIds } }),
  status: "Active",
  ...extra,
});

/**
 * The marks sheet for one exam: every student this user may mark, with what is saved already.
 * The teacher screen built its list from the whole class and started every student at 0, so it
 * showed other sections, never the saved marks, and saving again overwrote them with 0.
 */
export const getMarksSheetService = async ({ examId, user }) => {
  const exam = await Exam.findById(examId)
    .select("schoolId academicYearId schoolClassId sectionId subjectId createdBy title totalMarks passingMarks examDate")
    .lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }
  const scope = await markingScope(user, exam);
  const enrollments = await scopedEnrollments(exam, scope)
    .select("studentId sectionId rollNumber")
    .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name" } })
    .populate("sectionId", "name")
    .lean();
  const userIds = enrollments.map((e) => e.studentId?.userId?._id).filter(Boolean);
  const marks = await Marks.find({ examId, subjectId: exam.subjectId, studentId: { $in: userIds } })
    .select("studentId obtainedMarks isFinalSubmitted")
    .lean();
  const byStudent = new Map(marks.map((m) => [`${m.studentId}`, m]));
  const students = enrollments
    .filter((e) => e.studentId?.userId?._id)
    .map((e) => {
      const m = byStudent.get(`${e.studentId.userId._id}`);
      return {
        studentId: e.studentId.userId._id,
        studentName: e.studentId.userId.name,
        rollNumber: e.rollNumber ?? null,
        sectionId: e.sectionId?._id || null,
        sectionName: e.sectionId?.name || "",
        obtainedMarks: m ? m.obtainedMarks : null,
        isFinalSubmitted: Boolean(m?.isFinalSubmitted),
      };
    })
    .sort((a, b) => `${a.sectionName}`.localeCompare(`${b.sectionName}`) || (a.rollNumber ?? 1e9) - (b.rollNumber ?? 1e9));
  return {
    examId,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    wholeClass: scope.all,
    students,
  };
};

/**
 * The year's exams this user can enter marks for: for a Teacher, the ones they created and the
 * ones in a subject they teach (or a section they are class teacher of); everyone else, all.
 */
export const getMarkableExamsService = async ({ query, user }) => {
  const filters = { schoolId: user.schoolId };
  if (query.academicYearId) filters.academicYearId = query.academicYearId;
  const exams = await Exam.find(filters)
    .select("title examDate examType totalMarks passingMarks schoolClassId sectionId subjectId createdBy status academicYearId")
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .sort({ examDate: -1 })
    .limit(2000)
    .lean();
  if (actingRoleName(user, EXAM_STAFF_ROLES) !== "Teacher") return exams;

  const mine = await Section.find({
    schoolId: user.schoolId,
    ...(query.academicYearId ? { academicYearId: query.academicYearId } : {}),
    $or: [{ classTeacherId: user._id }, { "subjects.teacherId": user._id }],
  }).select("schoolClassId classTeacherId subjects").lean();
  const id = (v) => `${v?._id || v || ""}`;
  return exams.filter((ex) => {
    if (id(ex.createdBy) === `${user._id}`) return true;
    return mine.some((s) => id(s.schoolClassId) === id(ex.schoolClassId)
      && (!ex.sectionId || id(ex.sectionId) === id(s._id))
      && (id(s.classTeacherId) === `${user._id}`
        || (s.subjects || []).some((x) => id(x.subjectId) === id(ex.subjectId) && id(x.teacherId) === `${user._id}`)));
  });
};

export const assignExamToClassService = async ({ body, user }) => {
  const exam = await Exam.findById(body.examId).select("schoolId totalMarks passingMarks createdBy").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }
  // Setting which class sits an exam, and its marks there, is changing the exam: a Teacher only for
  // exams they created, as for editing and deleting one (see ensureCanChangeExam in the controller).
  if (actingRoleName(user, EXAM_STAFF_ROLES) === "Teacher" && `${exam.createdBy}` !== `${user._id}`) {
    throw new ApiError(403, "Teachers can change only exams they created");
  }

  const assignment = await ExamClass.findOneAndUpdate(
    { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    {
      $set: {
        schoolId: exam.schoolId,
        totalMarks: body.totalMarks ?? exam.totalMarks,
        passingMarks: body.passingMarks ?? exam.passingMarks,
      },
      $setOnInsert: { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    },
    { new: true, upsert: true }
  ).lean();

  return assignment;
};

export const enterMarksBulkService = async ({ body, user }) => {
  const { examId, marks = [] } = body;

  if (!examId || !Array.isArray(marks) || !marks.length) {
    throw new ApiError(400, "examId and non-empty marks array are required");
  }

  // 1. Get Exam
  const exam = await Exam.findById(examId)
    .select("schoolId academicYearId subjectId schoolClassId sectionId createdBy")
    .lean();

  if (!exam) throw new ApiError(404, "Exam not found");

  // 2. School Permission Check
  if (
    user.roleId?.name !== "Super Admin" &&
    `${exam.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school exam");
  }
  const scope = await markingScope(user, exam);

  // 3. Get student identifiers from payload (can be either User._id or Student._id)
  const studentIdentifiers = [
    ...new Set(marks.map((entry) => `${entry.studentId}`)),
  ];

  // 4. Resolve identifiers to both Student._id and User._id
  const students = await Student.find({
    $or: [
      { userId: { $in: studentIdentifiers } },
      { _id: { $in: studentIdentifiers } },
    ],
  })
    .select("_id userId")
    .lean();

  const identifierToStudent = new Map();
  for (const row of students) {
    identifierToStudent.set(`${row._id}`, {
      studentDocId: `${row._id}`,
      userId: `${row.userId}`,
    });
    identifierToStudent.set(`${row.userId}`, {
      studentDocId: `${row._id}`,
      userId: `${row.userId}`,
    });
  }

  const studentObjectIds = students.map((row) => row._id);

  // 5. Check enrollment
  // Only students this user may mark (see markingScope).
  const enrollments = await scopedEnrollments(exam, scope, { studentId: { $in: studentObjectIds } })
    .select("studentId")
    .lean();

  const allowedStudentIds = new Set(
    enrollments.map((row) => `${row.studentId}`)
  );

  // 5b. Block re-entry over marks already finalized — the single-mark PATCH endpoint
  // (updateMarksService) already refuses to edit a mark once isFinalSubmitted, but this bulk
  // upload had no equivalent check at all, so a teacher/admin could silently overwrite marks
  // after publishResultService had already computed and published percentage/grade/rank from the
  // old values, with no audit trail of the discrepancy and a published result that no longer
  // matched the underlying marks.
  const existingFinalized = await Marks.find({
    examId,
    subjectId: { $in: [...new Set(marks.map((entry) => `${entry.subjectId || exam.subjectId}`))] },
    isFinalSubmitted: true,
  })
    .select("studentId subjectId")
    .lean();
  const finalizedKeys = new Set(existingFinalized.map((m) => `${m.studentId}_${m.subjectId}`));

  // 6. VALIDATION + TRANSFORM DATA
  const bulkOps = [];

  for (const entry of marks) {
    const resolvedStudent = identifierToStudent.get(`${entry.studentId}`);

    if (!resolvedStudent) {
      throw new ApiError(400, `Invalid studentId: ${entry.studentId}`);
    }

    if (!allowedStudentIds.has(resolvedStudent.studentDocId)) {
      throw new ApiError(
        400,
        `Student ${entry.studentId} not enrolled in this class/section`
      );
    }

    const subjectId = entry.subjectId || exam.subjectId;
    if (finalizedKeys.has(`${resolvedStudent.userId}_${subjectId}`)) {
      throw new ApiError(
        400,
        `Marks for student ${entry.studentId} (subject ${subjectId}) are already finalized and cannot be re-entered via bulk upload`
      );
    }

    // bulkWrite skips the Marks model validators (min 0, obtained and passing <= total), so this
    // path saved 150 out of 100, or -10, and publishing then ranked students on them. The input
    // boxes cap the value, but a sheet uploaded on the teacher screen does not go through them.
    const totalMarks = Number(entry.totalMarks);
    const passingMarks = Number(entry.passingMarks ?? 0);
    const obtainedMarks = Number(entry.obtainedMarks ?? 0);
    if (![totalMarks, passingMarks, obtainedMarks].every(Number.isFinite) || totalMarks <= 0) {
      throw new ApiError(400, `Marks for student ${entry.studentId} must be numbers, with total marks above 0`);
    }
    if (obtainedMarks < 0 || obtainedMarks > totalMarks) {
      throw new ApiError(400, `Marks for student ${entry.studentId} must be between 0 and ${totalMarks}`);
    }
    if (passingMarks < 0 || passingMarks > totalMarks) {
      throw new ApiError(400, `Passing marks must be between 0 and ${totalMarks}`);
    }

    bulkOps.push({
      updateOne: {
        filter: {
          examId,
          studentId: resolvedStudent.userId,
          subjectId,
        },
        update: {
          $set: {
            schoolId: exam.schoolId,
            academicYearId: exam.academicYearId,
            schoolClassId: exam.schoolClassId, // ✅ FIXED
            sectionId: exam.sectionId || null, // ✅ FIXED
            totalMarks,
            passingMarks,
            obtainedMarks,
            updatedBy: user._id,
          },
          $setOnInsert: {
            examId,
            studentId: resolvedStudent.userId,
            subjectId,
            enteredBy: user._id,
          },
        },
        upsert: true,
      },
    });
  }

  // 7. Execute Bulk
  const result = await Marks.bulkWrite(bulkOps, { ordered: false });

  return {
    message: "Marks uploaded successfully",
    result,
  };
};

export const updateMarksService = async ({ markId, body, user }) => {
  const mark = await Marks.findById(markId);
  if (!mark) throw new ApiError(404, "Marks not found");
  if (mark.isFinalSubmitted) throw new ApiError(400, "Final marks already submitted");

  if (user.roleId?.name !== "Super Admin" && `${mark.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Not allowed");
  }
  const markExam = await Exam.findById(mark.examId).select("schoolId academicYearId schoolClassId sectionId subjectId createdBy").lean();
  const markScope = await markingScope(user, markExam);
  if (!markScope.all) {
    const student = await Student.findOne({ userId: mark.studentId }).select("_id").lean();
    const inScope = student && (await scopedEnrollments(markExam, markScope, { studentId: student._id }).countDocuments());
    if (!inScope) throw new ApiError(403, "This student is not in a section you teach this subject in");
  }

  if (body.obtainedMarks !== undefined) mark.obtainedMarks = Number(body.obtainedMarks);
  if (body.totalMarks !== undefined) mark.totalMarks = Number(body.totalMarks);
  if (body.passingMarks !== undefined) mark.passingMarks = Number(body.passingMarks);
  mark.updatedBy = user._id;
  await mark.save();
  return mark.toObject();
};

export const submitFinalMarksService = async ({ body, user }) => {
  const exam = await Exam.findById(body.examId).select("schoolId academicYearId schoolClassId sectionId subjectId createdBy").lean();
  if (!exam) throw new ApiError(404, "Exam not found");
  const scope = await markingScope(user, exam);
  const filter = {
    examId: body.examId,
    schoolClassId: body.schoolClassId,
    sectionId: body.sectionId || null,
    schoolId: user.schoolId,
  };
  // A subject teacher finalises only their own sections' students.
  if (!scope.all) {
    const enrolled = await scopedEnrollments(exam, scope)
      .select("studentId")
      .populate("studentId", "userId")
      .lean();
    filter.studentId = { $in: enrolled.map((e) => e.studentId?.userId).filter(Boolean) };
  }

  const update = await Marks.updateMany(filter, { $set: { isFinalSubmitted: true, updatedBy: user._id } });
  return update;
};

export const getExamAnalyticsService = async ({ examId, user }) => {
  const exam = await Exam.findById(examId)
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("subjectId", "name")
    .lean();

  if (!exam) throw new ApiError(404, "Exam not found");
  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  const [attemptStats, marksStats, resultStats] = await Promise.all([
    ExamAttempt.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          averageScore: { $avg: { $ifNull: ["$totalObtainedMarks", "$totalMarksObtained"] } },
        },
      },
    ]),
    Marks.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: null,
          studentsEvaluated: { $sum: 1 },
          averageObtainedMarks: { $avg: "$obtainedMarks" },
          highestScore: { $max: "$obtainedMarks" },
          lowestScore: { $min: "$obtainedMarks" },
          passCount: {
            $sum: {
              $cond: [{ $gte: ["$obtainedMarks", "$passingMarks"] }, 1, 0],
            },
          },
        },
      },
    ]),
    ExamResult.aggregate([
      { $match: { examId: new OBJECT_ID(examId) } },
      {
        $group: {
          _id: "$isPublished",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const marksSummary = marksStats[0] || {
    studentsEvaluated: 0,
    averageObtainedMarks: 0,
    highestScore: 0,
    lowestScore: 0,
    passCount: 0,
  };
  const attempted = attemptStats.reduce((acc, row) => acc + row.count, 0);
  const passPercentage = marksSummary.studentsEvaluated
    ? Number(((marksSummary.passCount / marksSummary.studentsEvaluated) * 100).toFixed(2))
    : 0;

  return {
    exam,
    attempts: {
      total: attempted,
      statusBreakdown: attemptStats,
    },
    evaluation: {
      ...marksSummary,
      averageObtainedMarks: Number((marksSummary.averageObtainedMarks || 0).toFixed(2)),
      passPercentage,
    },
    resultPublication: resultStats,
    enterpriseInsights: {
      riskLevel: passPercentage < 40 ? "high" : passPercentage < 70 ? "medium" : "low",
      recommendation:
        passPercentage < 40
          ? "Launch remediation batches, difficulty audit, and teacher review."
          : passPercentage < 70
          ? "Run targeted intervention groups and topic-wise re-tests."
          : "Maintain current strategy and scale best practices.",
    },
  };
};

const studentResultPipeline = ({ match }) => [
  { $match: match },
  {
    $lookup: {
      from: "subjects",
      localField: "subjectId",
      foreignField: "_id",
      as: "subject",
    },
  },
  { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: { examId: "$examId", studentId: "$studentId", schoolClassId: "$schoolClassId", sectionId: "$sectionId" },
      schoolId: { $first: "$schoolId" },
      academicYearId: { $first: "$academicYearId" },
      subjects: {
        $push: {
          subjectId: "$subjectId",
          subjectName: "$subject.name",
          obtainedMarks: "$obtainedMarks",
          totalMarks: "$totalMarks",
          passingMarks: "$passingMarks",
          isPassed: { $gte: ["$obtainedMarks", "$passingMarks"] },
        },
      },
      totalObtainedMarks: { $sum: "$obtainedMarks" },
      totalMaximumMarks: { $sum: "$totalMarks" },
      allPassed: { $min: { $gte: ["$obtainedMarks", "$passingMarks"] } },
    },
  },
  {
    $addFields: {
      percentage: {
        $cond: [
          { $gt: ["$totalMaximumMarks", 0] },
          { $round: [{ $multiply: [{ $divide: ["$totalObtainedMarks", "$totalMaximumMarks"] }, 100] }, 2] },
          0,
        ],
      },
    },
  },
];

export const publishResultService = async ({ body, user }) => {
  await assertTeacherOwnsExam(user, body.examId);
  const baseMatch = {
    examId: new OBJECT_ID(body.examId),
    schoolClassId: new OBJECT_ID(body.schoolClassId),
    schoolId: new OBJECT_ID(user.schoolId),
    isFinalSubmitted: true,
  };

  if (body.sectionId) baseMatch.sectionId = new OBJECT_ID(body.sectionId);

  const aggregated = await Marks.aggregate(studentResultPipeline({ match: baseMatch }));

  if (!aggregated.length) throw new ApiError(404, "No finalized marks found");

  const sorted = [...aggregated].sort((a, b) => b.totalObtainedMarks - a.totalObtainedMarks);
  // Equal totals share a rank and the next total takes the position after them (1, 2, 2, 4), the
  // same rule report cards use. Numbering by position gave two students with the same marks rank
  // 1 and 2, and which of them came first depended on the order the rows came back in.
  const rankMap = new Map();
  sorted.forEach((item, idx) => {
    const previous = sorted[idx - 1];
    const rank = previous && previous.totalObtainedMarks === item.totalObtainedMarks
      ? rankMap.get(`${previous._id.studentId}`)
      : idx + 1;
    rankMap.set(`${item._id.studentId}`, rank);
  });

  // Every row belongs to the same school (baseMatch.schoolId), so the scale is fetched once and
  // reused for the whole batch rather than re-querying per student.
  const gradeBands = await getGradeBands(user.schoolId);

  const ops = aggregated.map((row) => {
    const percentage = row.percentage || 0;
    const grade = resolveGrade(percentage, gradeBands);
    const resultStatus = row.allPassed ? "PASS" : "FAIL";

    return {
      updateOne: {
        filter: {
          schoolId: row.schoolId,
          examId: row._id.examId,
          studentId: row._id.studentId,
        },
        update: {
          $set: {
            academicYearId: row.academicYearId,
            schoolClassId: row._id.schoolClassId,
            sectionId: row._id.sectionId,
            subjects: row.subjects,
            totalObtainedMarks: row.totalObtainedMarks,
            totalMaximumMarks: row.totalMaximumMarks,
            percentage,
            grade,
            resultStatus,
            rank: rankMap.get(`${row._id.studentId}`) || null,
            isPublished: body.publish !== false,
            publishedAt: body.publish === false ? null : new Date(),
            publishedBy: body.publish === false ? null : user._id,
          },
          $setOnInsert: {
            schoolId: row.schoolId,
            examId: row._id.examId,
            studentId: row._id.studentId,
          },
        },
        upsert: true,
      },
    };
  });

  await ExamResult.bulkWrite(ops, { ordered: false });

  return {
    processed: aggregated.length,
    isPublished: body.publish !== false,
  };
};

export const getStudentResultService = async ({ query, user, studentId }) => {
  const scope = await resolveScope({ user, studentId });
  const filters = { studentId: scope.studentId };
  if (scope.schoolId) filters.schoolId = scope.schoolId;

  if (query.examId) filters.examId = query.examId;
  const role = examScopeRole(user);
  if (role === "Student" || role === "Parent") {
    filters.isPublished = true;
  }

  const data = await ExamResult.find(filters)
    .sort({ createdAt: -1 })
    .populate("examId", "title examDate")
    .populate("schoolClassId", "name")
    .lean();

  return data;
};

export const getClassResultSummaryService = async ({ query, user }) => {
  const match = {
    schoolId: new OBJECT_ID(user.schoolId),
    examId: new OBJECT_ID(query.examId),
    schoolClassId: new OBJECT_ID(query.schoolClassId),
    isPublished: true,
  };

  if (query.sectionId) match.sectionId = new OBJECT_ID(query.sectionId);

  const [summary] = await ExamResult.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$examId",
        students: { $sum: 1 },
        passCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "PASS"] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "FAIL"] }, 1, 0] } },
        averagePercentage: { $avg: "$percentage" },
        topper: {
          $top: {
            output: {
              studentId: "$studentId",
              totalObtainedMarks: "$totalObtainedMarks",
              percentage: "$percentage",
            },
            sortBy: { totalObtainedMarks: -1 },
          },
        },
      },
    },
    {
      $addFields: {
        passPercentage: {
          $cond: [
            { $gt: ["$students", 0] },
            { $round: [{ $multiply: [{ $divide: ["$passCount", "$students"] }, 100] }, 2] },
            0,
          ],
        },
      },
    },
  ]);

  return summary || { students: 0, passCount: 0, failCount: 0, averagePercentage: 0, passPercentage: 0 };
};

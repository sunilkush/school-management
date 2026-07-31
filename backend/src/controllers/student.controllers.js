import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Role } from "../models/Roles.model.js";
import { generateNextRegNumber } from "../utils/generateRegNumber.js";
import { AcademicYear } from "../models/AcademicYear.model.js";
import { Section } from "../models/section.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { HostelRoom } from "../models/HostelRoom.model.js";
import { StudentTransportAssignment } from "../models/StudentTransportAssignment.model.js";
import { School } from "../models/school.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
/* ================= ROLE FETCH ================= */
const getRoleByName = async (name, schoolId, session) => {
  return await Role.findOne({
    name, // ✅ name se match
    $or: [{ schoolId }, { schoolId: null }], // school specific + global
    isActive: true,
  }).session(session);
};

/* ================= CREATE STUDENT ================= */
const createStudentAdmission = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Multipart requests (web, when admission documents are attached) can't carry nested
    // objects as plain form fields, so the frontend sends the whole payload JSON-stringified
    // under "payload" instead; plain JSON requests (mobile app, or web with no documents) keep
    // using req.body directly.
    const body =
      typeof req.body?.payload === "string"
        ? JSON.parse(req.body.payload)
        : req.body;

    const {
      studentData,
      fatherData,
      motherData,
      schoolId,
      academicYearId,
      schoolClassId,
      sectionId,
    } = body;
    /* 🔐 VALIDATION */
    if (!studentData?.name || !studentData?.email) {
      throw new ApiError(400, "Student name & email required");
    }

    if (!schoolId || !academicYearId || !schoolClassId || !sectionId) {
      throw new ApiError(400, "School, class, section required");
    }

    /* 🔑 PASSWORD */
    // crypto.randomBytes().toString("hex") alone is always lowercase [0-9a-f] — it can satisfy
    // the "lowercase + digit" part of the password complexity validator (user.model.js) but can
    // never contain an uppercase letter, so User.create() below would reject every auto-generated
    // account. Appending one guaranteed character from each required class keeps the same
    // effective entropy while always passing validation.
    const generatePassword = () => {
      const base = crypto.randomBytes(6).toString("hex");
      const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"[crypto.randomInt(24)];
      const lower = "abcdefghjkmnpqrstuvwxyz"[crypto.randomInt(23)];
      const digit = String(crypto.randomInt(10));
      return `${base}${upper}${lower}${digit}`;
    };

    /* 🎯 ROLE AUTO PICK */

    const studentRole = await getRoleByName("Student", schoolId, session);
    const parentRole = await getRoleByName("Parent", schoolId, session);

    if (!studentRole || !parentRole) {
      throw new ApiError(500, "Roles not configured properly");
    }

    /* 👤 STUDENT USER */
    const studentPassword = generatePassword();
    const studentUser = (
      await User.create(
        [
          {
            name: studentData.name,
            email: studentData.email,
            password: studentPassword,
            roleId: studentRole._id,
            schoolId,
            isEmailVerified: true,
          },
        ],
        { session }
      )
    )[0];

    /* 👨 FATHER */
    let fatherUser = null;
    let fatherPassword = null;

    if (fatherData?.email) {
      fatherUser = await User.findOne({
        email: fatherData.email,
        schoolId,
        isActive: true,
        isDeleted: { $ne: true },
      }).session(session);

      if (!fatherUser) {
        fatherPassword = generatePassword();
        fatherUser = (
          await User.create(
            [
              {
                name: fatherData.name,
                email: fatherData.email,
                password: fatherPassword,
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              },
            ],
            { session }
          )
        )[0];
      }
    }

    /* 👩 MOTHER */
    let motherUser = null;
    let motherPassword = null;

    if (motherData?.email) {
      motherUser = await User.findOne({
        email: motherData.email,
        schoolId,
        isActive: true,
        isDeleted: { $ne: true },
      }).session(session);

      if (!motherUser) {
        motherPassword = generatePassword();
        motherUser = (
          await User.create(
            [
              {
                name: motherData.name,
                email: motherData.email,
                password: motherPassword,
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              },
            ],
            { session }
          )
        )[0];
      }
    }

    /* 📎 ADMISSION DOCUMENTS */
    const documentFiles = Array.isArray(req.files?.documents)
      ? req.files.documents
      : [];

    // documentLabels is a parallel array (same order as the "documents" file field) carrying
    // the admin-entered label per document, e.g. "Birth Certificate" — falls back to the
    // filename when a label wasn't provided.
    const documentLabels = Array.isArray(body.documentLabels)
      ? body.documentLabels
      : [];

    const documents = [];
    for (let i = 0; i < documentFiles.length; i++) {
      const file = documentFiles[i];
      const uploaded = await uploadOnCloudinary(file.path);

      if (!uploaded?.secure_url && !uploaded?.url) {
        throw new ApiError(500, "Failed to upload one or more documents");
      }

      documents.push({
        name:
          documentLabels[i]?.trim() ||
          file.originalname ||
          uploaded.original_filename ||
          "document",
        url: uploaded.secure_url || uploaded.url,
        mimeType: file.mimetype || "",
        publicId: uploaded.public_id || "",
      });
    }

    /* 🎓 STUDENT PROFILE */
    const student = (
      await Student.create(
        [
          {
            userId: studentUser._id,
            fatherId: fatherUser?._id || null,
            motherId: motherUser?._id || null,
            schoolId,
            dateOfBirth: studentData.dateOfBirth,
            gender: studentData.gender,
            address: studentData.address,
            bloodGroup: studentData.bloodGroup,
            fatherInfo: fatherData,
            motherInfo: motherData,
            documents,
          },
        ],
        { session }
      )
    )[0];

    /* 📚 REGISTRATION NUMBER */
    const academicYear = await AcademicYear.findById(academicYearId).session(
      session
    );
    const regYear = academicYear?.code || new Date().getFullYear();

    // Finding "most recently created" here (regardless of format) previously broke as soon as
    // any enrollment existed in a different numbering scheme (e.g. seed data using its own
    // ad-hoc reg-number format) — generateNextRegNumber would then reset to 0001 and collide with
    // whatever real "REG..."-formatted record already held that number. Scoping the lookup to
    // enrollments that actually match this year's expected prefix, and taking the lexicographically
    // highest one (safe because the numeric suffix is fixed-width zero-padded), finds the real
    // last-issued number in *this* format specifically.
    const regNoPrefix = `REG${regYear}`;
    const lastEnrollment = await StudentEnrollment.findOne({
      schoolId,
      academicYearId,
      registrationNumber: { $regex: `^${escapeRegex(regNoPrefix)}` },
    })
      .sort({ registrationNumber: -1 })
      .session(session);

    const nextRegNo = generateNextRegNumber(
      lastEnrollment?.registrationNumber,
      {
        prefix: "REG",
        year: regYear,
        digits: 4,
      }
    );

    /* 🔢 ROLL NUMBER — sequential within class + section + academic year */
    const lastRollEnrollment = await StudentEnrollment.findOne({
      schoolId,
      academicYearId,
      schoolClassId,
      sectionId,
      rollNumber: { $ne: null },
    })
      .sort({ rollNumber: -1 })
      .session(session);

    const nextRollNumber = (lastRollEnrollment?.rollNumber || 0) + 1;

    /* 📚 ENROLLMENT */
    const enrollment = (
      await StudentEnrollment.create(
        [
          {
            studentId: student._id,
            schoolId,
            academicYearId,
            schoolClassId,
            sectionId,
            registrationNumber: nextRegNo,
            rollNumber: nextRollNumber,
            mobileNumber:
              fatherData?.mobile || motherData?.mobile || null,
          },
        ],
        { session }
      )
    )[0];
    
    // ✅ Save student enrollment reference inside selected section
    const updatedSection = await Section.findOneAndUpdate(
      {
        _id: sectionId,
        schoolId,
        schoolClassId,
      },
      {
        $addToSet: { StudentEnrollmentId: enrollment._id },
      },
      { new: true, session }
    );

    if (!updatedSection) {
      throw new ApiError(404, "Section not found for selected class");
    }


    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          student,
          studentUser,
          father: fatherUser,
          mother: motherUser,
          enrollment,
          credentials: {
            student: {
              userId: studentUser._id,
              loginId: studentUser.email,
              password: studentPassword,
              isNew: true,
            },
            father: fatherUser
              ? {
                  userId: fatherUser._id,
                  loginId: fatherUser.email,
                  password: fatherPassword,
                  isNew: Boolean(fatherPassword),
                }
              : null,
            mother: motherUser
              ? {
                  userId: motherUser._id,
                  loginId: motherUser.email,
                  password: motherPassword,
                  isNew: Boolean(motherPassword),
                }
              : null,
          },
        },
        "Student admission successful"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

/* ================= BULK IMPORT STUDENTS ================= */
// Onboarding an existing school (hundreds of students) previously had no supported path other
// than one-by-one admission through the UI. Accepts rows already parsed client-side (same
// dual-mode convention as bulkCreateQuestionsFromExcel — the frontend parses the .xlsx and posts
// plain JSON rows, no multer needed here). Validates every row up front and reports failures
// per-row rather than failing the whole batch; each row that *does* pass validation is then
// created in its own transaction, so one row's unexpected runtime error can't roll back siblings
// that already committed successfully — a genuine partial-commit import, not all-or-nothing.
const bulkImportStudents = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, rows } = req.body;

  if (!schoolId || !academicYearId) {
    throw new ApiError(400, "schoolId and academicYearId are required");
  }
  if (!Array.isArray(rows) || !rows.length) {
    throw new ApiError(400, "rows must be a non-empty array");
  }
  if (rows.length > 500) {
    throw new ApiError(400, "Maximum 500 students per import — split into smaller batches");
  }

  const academicYear = await AcademicYear.findOne({ _id: academicYearId, schoolId });
  if (!academicYear) throw new ApiError(404, "Academic year not found for this school");

  const studentRole = await getRoleByName("Student", schoolId);
  const parentRole = await getRoleByName("Parent", schoolId);
  if (!studentRole || !parentRole) throw new ApiError(500, "Roles not configured properly");

  // Resolve class/section names -> ids once (case-insensitive), rather than a lookup per row —
  // admins uploading a spreadsheet know class/section names, not internal ObjectIds.
  const classes = await SchoolClass.find({ schoolId, academicYearId }).select("_id name").lean();
  const classByName = new Map(classes.map((c) => [String(c.name).trim().toLowerCase(), c]));
  const sections = await Section.find({ schoolId, academicYearId }).select("_id name schoolClassId").lean();
  const sectionByKey = new Map(
    sections.map((s) => [`${s.schoolClassId}_${String(s.name).trim().toLowerCase()}`, s])
  );

  // Seeds the running registration number from the latest existing enrollment *in this exact
  // REG{year}{####} format* — not just "most recently created" regardless of format, which
  // breaks as soon as any enrollment exists in a different numbering scheme (e.g. seed data using
  // its own ad-hoc reg-number format): generateNextRegNumber would reset to 0001 and collide with
  // whatever real record already holds that number. Then advances in memory after each successful
  // row — re-querying the DB after every single row would be both slower and unnecessary (nothing
  // else can be enrolling concurrently mid-loop).
  const regNoPrefix = `REG${academicYear.code || new Date().getFullYear()}`;
  const lastEnrollment = await StudentEnrollment.findOne({
    schoolId,
    academicYearId,
    registrationNumber: { $regex: `^${escapeRegex(regNoPrefix)}` },
  }).sort({ registrationNumber: -1 });
  let runningLastRegNo = lastEnrollment?.registrationNumber || null;

  // Existing emails in this school, fetched once — email uniqueness is scoped to {email,
  // schoolId} (see user.model.js), so duplicate detection only needs to consider this school.
  const existingEmails = new Set(
    (await User.find({ schoolId }).select("email").lean()).map((u) => String(u.email).toLowerCase())
  );
  const seenEmailsInBatch = new Set();

  const results = { created: [], errors: [] };
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // spreadsheet row — row 1 is the header
    const row = rows[i] || {};
    const rowErrors = [];

    const name = String(row.name || "").trim();
    const email = String(row.email || "").trim().toLowerCase();
    const className = String(row.className || row.class || "").trim();
    const sectionName = String(row.sectionName || row.section || "").trim();

    if (!name) rowErrors.push("name is required");
    if (!email) rowErrors.push("email is required");
    else if (!EMAIL_RE.test(email)) rowErrors.push("email is not a valid email address");
    if (!className) rowErrors.push("class is required");
    if (!sectionName) rowErrors.push("section is required");

    let schoolClass = null;
    let section = null;
    if (className) {
      schoolClass = classByName.get(className.toLowerCase());
      if (!schoolClass) rowErrors.push(`class "${className}" not found`);
    }
    if (schoolClass && sectionName) {
      section = sectionByKey.get(`${schoolClass._id}_${sectionName.toLowerCase()}`);
      if (!section) rowErrors.push(`section "${sectionName}" not found in class "${className}"`);
    }

    if (email) {
      if (existingEmails.has(email)) rowErrors.push(`email "${email}" already exists in this school`);
      else if (seenEmailsInBatch.has(email)) rowErrors.push(`email "${email}" is duplicated within this file`);
    }

    if (row.gender && !["Male", "Female", "Other"].includes(row.gender)) {
      rowErrors.push("gender must be Male, Female, or Other");
    }
    if (row.dateOfBirth && Number.isNaN(new Date(row.dateOfBirth).getTime())) {
      rowErrors.push("dateOfBirth is not a valid date");
    }

    if (rowErrors.length) {
      results.errors.push({ row: rowNum, name: name || email || "(unnamed)", reasons: rowErrors });
      continue;
    }

    seenEmailsInBatch.add(email);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // crypto.randomBytes().toString("hex") alone is always lowercase [0-9a-f] — it can satisfy
    // the "lowercase + digit" part of the password complexity validator (user.model.js) but can
    // never contain an uppercase letter, so User.create() below would reject every auto-generated
    // account. Appending one guaranteed character from each required class keeps the same
    // effective entropy while always passing validation.
    const generatePassword = () => {
      const base = crypto.randomBytes(6).toString("hex");
      const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"[crypto.randomInt(24)];
      const lower = "abcdefghjkmnpqrstuvwxyz"[crypto.randomInt(23)];
      const digit = String(crypto.randomInt(10));
      return `${base}${upper}${lower}${digit}`;
    };
      const studentPassword = generatePassword();

      const studentUser = (
        await User.create(
          [{ name, email, password: studentPassword, roleId: studentRole._id, schoolId, isEmailVerified: true }],
          { session }
        )
      )[0];

      let fatherUser = null;
      let fatherPassword = null;
      const fatherEmail = String(row.fatherEmail || "").trim().toLowerCase();
      if (fatherEmail) {
        fatherUser = await User.findOne({ email: fatherEmail, schoolId, isActive: true, isDeleted: { $ne: true } }).session(session);
        if (!fatherUser) {
          fatherPassword = generatePassword();
          fatherUser = (
            await User.create(
              [{
                name: String(row.fatherName || "").trim() || "Parent",
                email: fatherEmail,
                password: fatherPassword,
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              }],
              { session }
            )
          )[0];
        }
      }

      let motherUser = null;
      let motherPassword = null;
      const motherEmail = String(row.motherEmail || "").trim().toLowerCase();
      if (motherEmail) {
        motherUser = await User.findOne({ email: motherEmail, schoolId, isActive: true, isDeleted: { $ne: true } }).session(session);
        if (!motherUser) {
          motherPassword = generatePassword();
          motherUser = (
            await User.create(
              [{
                name: String(row.motherName || "").trim() || "Parent",
                email: motherEmail,
                password: motherPassword,
                roleId: parentRole._id,
                schoolId,
                isEmailVerified: true,
              }],
              { session }
            )
          )[0];
        }
      }

      const student = (
        await Student.create(
          [{
            userId: studentUser._id,
            fatherId: fatherUser?._id || null,
            motherId: motherUser?._id || null,
            schoolId,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
            gender: row.gender || undefined,
            address: row.address || undefined,
            bloodGroup: row.bloodGroup || undefined,
            fatherInfo: fatherEmail ? { name: row.fatherName, email: fatherEmail, mobile: row.fatherMobile } : undefined,
            motherInfo: motherEmail ? { name: row.motherName, email: motherEmail, mobile: row.motherMobile } : undefined,
          }],
          { session }
        )
      )[0];

      const nextRegNo = generateNextRegNumber(runningLastRegNo, {
        prefix: "REG",
        year: academicYear.code || new Date().getFullYear(),
        digits: 4,
      });

      const lastRollEnrollment = await StudentEnrollment.findOne({
        schoolId, academicYearId, schoolClassId: schoolClass._id, sectionId: section._id, rollNumber: { $ne: null },
      }).sort({ rollNumber: -1 }).session(session);
      const nextRollNumber = (lastRollEnrollment?.rollNumber || 0) + 1;

      const enrollment = (
        await StudentEnrollment.create(
          [{
            studentId: student._id,
            schoolId,
            academicYearId,
            schoolClassId: schoolClass._id,
            sectionId: section._id,
            registrationNumber: nextRegNo,
            rollNumber: nextRollNumber,
            mobileNumber: row.fatherMobile || row.motherMobile || row.mobileNumber || null,
            createdBy: req.user._id,
          }],
          { session }
        )
      )[0];

      await Section.findOneAndUpdate(
        { _id: section._id, schoolId, schoolClassId: schoolClass._id },
        { $addToSet: { StudentEnrollmentId: enrollment._id } },
        { session }
      );

      await session.commitTransaction();

      runningLastRegNo = nextRegNo;
      existingEmails.add(email);

      results.created.push({
        row: rowNum,
        name,
        email,
        registrationNumber: nextRegNo,
        rollNumber: nextRollNumber,
        studentId: student._id,
        credentials: {
          student: { loginId: email, password: studentPassword },
          father: fatherPassword ? { loginId: fatherEmail, password: fatherPassword } : null,
          mother: motherPassword ? { loginId: motherEmail, password: motherPassword } : null,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      results.errors.push({ row: rowNum, name: name || email || "(unnamed)", reasons: [err.message || "Unexpected error"] });
    } finally {
      session.endSession();
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      results,
      `Imported ${results.created.length} of ${rows.length} students (${results.errors.length} failed)`
    )
  );
});

/* ================= TRANSFER STUDENT (INTER-SCHOOL) ================= */
// There was previously no supported path to move a student to a different school on the
// platform at all. Student.userId is unique (one User = one Student profile, enforced by the
// schema), so a transfer can't create a second Student/User pair for the same person — it moves
// the existing User/Student's schoolId to the destination and opens a fresh enrollment there,
// closing out the old one. Historical records at the origin school (attendance, fees, exam
// results, payments) are deliberately left untouched under the origin schoolId — they're that
// school's own record of the time the student spent there, not data to be silently rewritten to
// belong to a different tenant.
const transferStudent = asyncHandler(async (req, res) => {
  const {
    studentId,
    userId,
    targetSchoolId,
    targetAcademicYearId,
    targetSchoolClassId,
    targetSectionId,
  } = req.body;

  if (!(studentId || userId) || !targetSchoolId || !targetAcademicYearId || !targetSchoolClassId || !targetSectionId) {
    throw new ApiError(400, "studentId (or userId), targetSchoolId, targetAcademicYearId, targetSchoolClassId and targetSectionId are required");
  }

  // Accepts either id — the platform-wide Super Admin user list (UserRoleList.jsx) only has each
  // person's User._id on hand, not their separate Student._id.
  const student = studentId
    ? await Student.findById(studentId)
    : await Student.findOne({ userId });
  if (!student) throw new ApiError(404, "Student not found");

  if (String(student.schoolId) === String(targetSchoolId)) {
    throw new ApiError(400, "Student is already enrolled at this school — use promotion/section-change instead of transfer");
  }

  const [targetSchool, targetAcademicYear, targetSchoolClass, targetSection] = await Promise.all([
    School.findById(targetSchoolId),
    AcademicYear.findOne({ _id: targetAcademicYearId, schoolId: targetSchoolId }),
    SchoolClass.findOne({ _id: targetSchoolClassId, schoolId: targetSchoolId }),
    Section.findOne({ _id: targetSectionId, schoolId: targetSchoolId, schoolClassId: targetSchoolClassId }),
  ]);
  if (!targetSchool) throw new ApiError(404, "Target school not found");
  if (!targetAcademicYear) throw new ApiError(404, "Target academic year not found for that school");
  if (!targetSchoolClass) throw new ApiError(404, "Target class not found for that school");
  if (!targetSection) throw new ApiError(404, "Target section not found for that class");

  const sourceSchoolId = student.schoolId;
  const studentUser = await User.findById(student.userId);
  if (!studentUser) throw new ApiError(404, "Linked user account not found for this student");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Close out every currently-active enrollment at the origin school.
    await StudentEnrollment.updateMany(
      { studentId: student._id, schoolId: sourceSchoolId, status: "Active" },
      { $set: { status: "Transferred" } },
      { session }
    );

    // Free up capacity-limited resources at the origin school — same reasoning as deactivating a
    // student (see deleteStudent): a departed student shouldn't keep "holding" a hostel bed or
    // transport seat that could otherwise be reassigned.
    await HostelRoom.updateMany(
      { schoolId: sourceSchoolId, "students.studentId": studentUser._id },
      { $pull: { students: { studentId: studentUser._id } } },
      { session }
    );
    const sourceEnrollmentIds = (
      await StudentEnrollment.find({ studentId: student._id, schoolId: sourceSchoolId }).select("_id").session(session)
    ).map((e) => e._id);
    await StudentTransportAssignment.updateMany(
      { schoolId: sourceSchoolId, studentEnrollmentId: { $in: sourceEnrollmentIds }, isActive: true },
      { $set: { isActive: false } },
      { session }
    );

    // Move the student's identity to the destination school.
    student.schoolId = targetSchoolId;
    await student.save({ session });
    studentUser.schoolId = targetSchoolId;
    await studentUser.save({ session });

    // Registration number, scoped to the destination school's own numbering (see
    // bulkImportStudents for why this specifically matches on format, not just "most recent").
    const regNoPrefix = `REG${targetAcademicYear.code || new Date().getFullYear()}`;
    const lastEnrollment = await StudentEnrollment.findOne({
      schoolId: targetSchoolId,
      academicYearId: targetAcademicYearId,
      registrationNumber: { $regex: `^${escapeRegex(regNoPrefix)}` },
    }).sort({ registrationNumber: -1 }).session(session);
    const nextRegNo = generateNextRegNumber(lastEnrollment?.registrationNumber, {
      prefix: "REG",
      year: targetAcademicYear.code || new Date().getFullYear(),
      digits: 4,
    });

    const lastRollEnrollment = await StudentEnrollment.findOne({
      schoolId: targetSchoolId,
      academicYearId: targetAcademicYearId,
      schoolClassId: targetSchoolClassId,
      sectionId: targetSectionId,
      rollNumber: { $ne: null },
    }).sort({ rollNumber: -1 }).session(session);
    const nextRollNumber = (lastRollEnrollment?.rollNumber || 0) + 1;

    const newEnrollment = (
      await StudentEnrollment.create(
        [{
          studentId: student._id,
          schoolId: targetSchoolId,
          academicYearId: targetAcademicYearId,
          schoolClassId: targetSchoolClassId,
          sectionId: targetSectionId,
          registrationNumber: nextRegNo,
          rollNumber: nextRollNumber,
          mobileNumber: student.fatherInfo?.mobile || student.motherInfo?.mobile || null,
          createdBy: req.user._id,
        }],
        { session }
      )
    )[0];

    await Section.findOneAndUpdate(
      { _id: targetSectionId, schoolId: targetSchoolId, schoolClassId: targetSchoolClassId },
      { $addToSet: { StudentEnrollmentId: newEnrollment._id } },
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json(
      new ApiResponse(
        200,
        { student, studentUser, enrollment: newEnrollment, targetSchool: { _id: targetSchool._id, name: targetSchool.name } },
        `Student transferred to ${targetSchool.name} successfully`
      )
    );
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ✅ Get Students (with aggregation)
export const getStudentsByRole = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId, schoolClassId, page = 1, limit = 500 } = req.query;
  if (!schoolId || !academicYearId) {
    throw new ApiError(400, "schoolId and academicYearId are required");
  }

  const filter = { schoolId, academicYearId, status: "Active" };
  if (schoolClassId) filter.schoolClassId = schoolClassId;

  // The frontend thunk (fetchAllStudentByRole) already sends page/limit — this was silently
  // discarding both and always returning the whole active roster for the school/year regardless.
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(Math.max(Number(limit) || 500, 1), 2000);
  const skip = (pageNumber - 1) * limitNumber;

  const [enrollments, total] = await Promise.all([
    StudentEnrollment.find(filter)
      .populate({ path: "studentId", populate: { path: "userId", select: "name email phone" } })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    StudentEnrollment.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { students: enrollments, pagination: { total, page: pageNumber, limit: limitNumber, totalPages: Math.ceil(total / limitNumber) } },
      "Students Retrieved Successfully"
    )
  );
});
export const getStudentsSuperAdmin = asyncHandler(async (req, res) => {
  const { schoolClassId, sectionId, page = 1, limit = 10 } = req.query;
  const academicYearId = req.academicYearId;

  if (!academicYearId || !mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Valid academic year is required!");
  }

  const pageNumber = Math.max(parseInt(page) || 1, 1);
  const limitNumber = Math.max(parseInt(limit) || 10, 1);
  const skip = (pageNumber - 1) * limitNumber;

  const match = {
    academicYearId: new mongoose.Types.ObjectId(academicYearId),
  };

  if (schoolClassId && mongoose.Types.ObjectId.isValid(schoolClassId)) {
    match.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  }

  if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
    match.sectionId = new mongoose.Types.ObjectId(sectionId);
  }

  const result = await StudentEnrollment.aggregate([
    { $match: match },

    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentInfo",
      },
    },
    { $unwind: { path: "$studentInfo", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        let: { userRef: "$studentInfo.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userRef"] },
              isActive: true,
              isDeleted: { $ne: true },
            },
          },
        ],
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "schoolclasses",
        localField: "schoolClassId",
        foreignField: "_id",
        as: "classDetails",
      },
    },
    { $unwind: { path: "$classDetails", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "sectionDetails",
      },
    },
    { $unwind: { path: "$sectionDetails", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        registrationNumber: 1,
        admissionDate: 1,
        createdAt: 1,
        status: 1,
        // Student._id (distinct from this row's own StudentEnrollment._id, which is what `_id`
        // is here) — needed by any client that wants to drill into GET /student/getStudent/:id
        // for one row; without it the list has no usable id for that lookup at all.
        studentId: "$studentInfo._id",
        studentName: "$userDetails.name",
        className: "$classDetails.name",
        sectionName: "$sectionDetails.name",
        mobile: "$userDetails.mobile",
      },
    },

    // _id tiebreaker: bulk class-promotion inserts (insertMany) share an identical createdAt, so
    // sorting on createdAt alone is not a stable order — without a unique tiebreaker, the same row
    // can land in both page N and page N+1's window (or get skipped entirely) across separate
    // aggregate() calls, which is exactly what produced a duplicate _id (and a React key warning)
    // in the mobile student list.
    { $sort: { createdAt: -1, _id: -1 } },
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  const total = await StudentEnrollment.countDocuments(match);

  return res.status(200).json(
    new ApiResponse(200, {
      students: result,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    })
  );
});

// ✅ Get Student by ID
const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid student ID");
  }

  // :id used to be accepted but never actually queried on — every caller silently got back
  // whatever Student document matched their own userId, regardless of which id was requested.
  // That happened to be safe for the Student role (own profile only) but meant Teacher/Admin/
  // Principal/Vice Principal could never actually look up a specific student (their own userId
  // never matches a Student doc, so they always got a 403), and Parent wasn't even route-gated in.
  // Restoring the parameter's actual purpose: Student still only ever gets their own profile
  // (ignore :id entirely, same as before — no regression); every other allowed role looks up the
  // requested student by id, scoped to their school (or to their own linked child, for Parent).
  const roleName = req.userRole?.name;
  const schoolId = req.user?.schoolId?._id || req.user?.schoolId;

  let query;
  if (roleName === "Student") {
    query = { userId: req.user._id };
  } else if (roleName === "Parent") {
    query = {
      _id: id,
      schoolId,
      $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
    };
  } else {
    // Super Admin / School Admin / Teacher / Principal / Vice Principal
    query = { _id: id };
    if (roleName !== "Super Admin") query.schoolId = schoolId;
  }

  const student = await Student.findOne(query)
    .populate({ path: "userId", select: "-password -refreshToken", match: { isActive: true, isDeleted: { $ne: true } } })
    .populate({ path: "fatherId", select: "name email", match: { isActive: true, isDeleted: { $ne: true } } })
    .populate({ path: "motherId", select: "name email", match: { isActive: true, isDeleted: { $ne: true } } });

  if (!student) {
    throw new ApiError(403, "You are not authorized to view this student");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, "Student fetched successfully"));
});


// ✅ Update Student
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    registrationNumber,
    schoolClassId,
    sectionId,
    schoolId,
    academicYearId,
    admissionDate,
    feeDiscount,
    smsMobile,
    mobileNumber,
    status,
    otherInfo = {},
    fatherInfo = {},
    motherInfo = {},
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    /* ===========================
       🎓 STUDENT FIND
    ============================ */
    const student = await Student.findById(id).session(session);

    if (!student) {
      throw new ApiError(404, "Student not found!");
    }

    const updaterRoleName = req.userRole?.name || req.user?.roleId?.name || req.user?.role?.name;
    if (updaterRoleName !== "Super Admin" && `${student.schoolId}` !== `${req.user.schoolId}`) {
      throw new ApiError(403, "Forbidden access outside your school");
    }

    /* ===========================
       📚 ENROLLMENT FIND
    ============================ */
    const enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      ...(academicYearId && { academicYearId }),
    }).session(session);

    if (!enrollment) {
      throw new ApiError(404, "Enrollment not found!");
    }

    /* ===========================
       🧠 UPDATE STUDENT (DIRECT FIELDS)
    ============================ */
    const validStudentFields = [
      "dateOfBirth",
      "gender",
      "religion",
      "cast",
      "bloodGroup",
      "address",
      "identificationMark",
      "family",
      "disease",
      "notes",
      "siblings",
      "previousSchool",
      "orphan",
    ];

    for (const field of validStudentFields) {
      if (otherInfo[field] !== undefined) {
        student[field] = otherInfo[field];
      }
    }

    /* ===========================
       👨 FATHER INFO UPDATE
    ============================ */
    if (fatherInfo && typeof fatherInfo === "object") {
      student.fatherInfo = {
        ...student.fatherInfo,
        ...fatherInfo,
      };
    }

    /* ===========================
       👩 MOTHER INFO UPDATE
    ============================ */
    if (motherInfo && typeof motherInfo === "object") {
      student.motherInfo = {
        ...student.motherInfo,
        ...motherInfo,
      };
    }

    await student.save({ session });

    /* ===========================
       📚 UPDATE ENROLLMENT
    ============================ */
    if (registrationNumber) {
      enrollment.registrationNumber = registrationNumber;
    }

    if (schoolClassId) {
      enrollment.schoolClassId = schoolClassId;
    }

    if (sectionId) {
      enrollment.sectionId = sectionId;
    }

    if (schoolId) {
      enrollment.schoolId = schoolId;
    }

    if (admissionDate) {
      enrollment.admissionDate = admissionDate;
    }

    if (feeDiscount !== undefined) {
      enrollment.feeDiscount = feeDiscount;
    }

    if (smsMobile) {
      enrollment.smsMobile = smsMobile;
    }

    if (mobileNumber) {
      enrollment.mobileNumber = mobileNumber;
    }

    if (status) {
      enrollment.status = status;
    }

    await enrollment.save({ session });

    /* ===========================
       ✅ COMMIT
    ============================ */
    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(
      new ApiResponse(
        200,
        { student, enrollment },
        "Student updated successfully!"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// ✅ Delete Student
const deleteStudent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Student.findById(id);
    if (!existing) {
      throw new ApiError(404, "Student not found!");
    }

    const deleterRoleName = req.userRole?.name || req.user?.roleId?.name || req.user?.role?.name;
    if (deleterRoleName !== "Super Admin" && `${existing.schoolId}` !== `${req.user.schoolId}`) {
      throw new ApiError(403, "Forbidden access outside your school");
    }

    // Soft delete — this was the only hard delete of a student record anywhere in the app
    // (deleteUser in user.controllers.js already uses isActive/isDeleted for every other role).
    // A hard delete here orphaned every StudentEnrollment/StudentFee/Payment/IssuedBook/
    // hostel-room/transport-assignment record that referenced this student, with no way back
    // from an accidental click.
    existing.isActive = false;
    existing.status = "inactive";
    await existing.save();

    await User.findByIdAndUpdate(existing.userId, { isActive: false, isDeleted: true });

    // Also drop them out of their current class roster — otherwise they'd keep showing up in
    // attendance-marking, class lists, etc. despite being deactivated.
    const activeEnrollments = await StudentEnrollment.find(
      { studentId: existing._id, status: "Active" },
      "_id"
    ).lean();
    await StudentEnrollment.updateMany(
      { studentId: existing._id, status: "Active" },
      { $set: { status: "Inactive" } }
    );

    // Free up capacity-limited resources they were occupying — otherwise a deactivated student
    // keeps "holding" a hostel bed/transport seat that can never be reassigned to anyone else.
    await HostelRoom.updateMany(
      { "students.studentId": existing.userId },
      { $pull: { students: { studentId: existing.userId } } }
    );
    if (activeEnrollments.length) {
      await StudentTransportAssignment.updateMany(
        { studentEnrollmentId: { $in: activeEnrollments.map((e) => e._id) }, isActive: true },
        { $set: { isActive: false } }
      );
    }

    return res.status(200).json(new ApiResponse(200, {}, "Student deactivated successfully!"));
  } catch (error) {
    throw new ApiError(500, error.message || "Something went wrong!");
  }
});

// ✅ Get last student & generate next reg no
const getLastRegisteredStudent = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId } = req.query;

  // ✅ Validate IDs
  if (!schoolId || !academicYearId) {
    throw new ApiError(400, "schoolId and academicYearId are required");
  }

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "Invalid schoolId format");
  }

  if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
    throw new ApiError(400, "Invalid academicYearId format");
  }

  // ✅ Use aggregation instead of findOne()
  const lastStudentAgg = await StudentEnrollment.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: 1,
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: {
        path: "$student",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        registrationNumber: 1,
        studentName: "$student.studentName",
      },
    },
  ]);

  const lastStudent = lastStudentAgg[0] || null;

  // ✅ Fetch Academic Year Code
  const academicYearDoc = await AcademicYear.findById(academicYearId).lean();
  const yearLabel = academicYearDoc?.code || new Date().getFullYear();

  // ✅ Generate next registration number
  const lastRegNumber = lastStudent?.registrationNumber ?? null;
  const nextRegNo = generateNextRegNumber(lastRegNumber, {
    prefix: "REG",
    year: yearLabel,
    digits: 4,
  });

  // ✅ Send response
  return res.status(200).json(
    new ApiResponse(200, {
      registrationNumber: nextRegNo,
      lastStudent: lastStudent
        ? {
          name: lastStudent.studentName || null,
          registrationNumber: lastStudent.registrationNumber,
        }
        : null,
    }, "Last registered student fetched successfully")
  );
});

 const getStudentsBySchoolId = asyncHandler(async (req, res) => {
  let { schoolId, academicYearId, schoolClassId, sectionId, search = "", page, limit } = req.query;

  const requesterSchoolId =
    req.user?.school?._id || req.user?.schoolId;

  const roleName =
    req.user?.role?.name ||
    req.user?.roleId?.name ||
    "";

  // ✅ Fix role logic
  if (roleName !== "Super Admin") {
    if (!requesterSchoolId) {
      throw new ApiError(400, "School context missing");
    }
    schoolId = requesterSchoolId;
  }

  if (!schoolId) {
    throw new ApiError(400, "schoolId required");
  }

  const matchFilter = {
    schoolId: new mongoose.Types.ObjectId(schoolId),
  };

  // ✅ Active academic year
  if (!academicYearId) {
    const activeYear = await AcademicYear.findOne({
      schoolId,
      isActive: true,
    }).lean();

    if (!activeYear) {
      throw new ApiError(404, "No active academic year");
    }

    academicYearId = activeYear._id;
  }

  matchFilter.academicYearId = new mongoose.Types.ObjectId(academicYearId);

  if (schoolClassId && mongoose.Types.ObjectId.isValid(schoolClassId)) {
    matchFilter.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  }
  if (sectionId && mongoose.Types.ObjectId.isValid(sectionId)) {
    matchFilter.sectionId = new mongoose.Types.ObjectId(sectionId);
  }

  page = Number(page) || 1;
  limit = Number(limit) || 500;
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchFilter },

    // 🔥 STUDENT
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },

    // 🔥 USER
    {
      $lookup: {
        from: "users",
        let: { userRef: "$student.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userRef"] },
              isActive: true,
              isDeleted: { $ne: true },
            },
          },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
  $lookup: {
    from: "academicyears",
    localField: "academicYearId",
    foreignField: "_id",
    as: "academicYear",
  },
},
{
  $unwind: {
    path: "$academicYear",
    preserveNullAndEmptyArrays: true,
  },
},

    // ✅ FIX: delete filter safe
    {
      $match: {
        "user.isDeleted": { $ne: true },
      },
    },

    // 🔥 CLASS
    {
      $lookup: {
        from: "schoolclasses",
        localField: "schoolClassId",
        foreignField: "_id",
        as: "schoolClass",
      },
    },
    { $unwind: "$schoolClass" },

    // 🔥 SECTION
    {
      $lookup: {
        from: "sections",
        localField: "sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: "$section" },

    // 🔥 SEARCH FIX
    ...(search
      ? [
          {
            $match: {
              $or: [
                { "user.name": { $regex: escapeRegex(search), $options: "i" } },
                { "user.email": { $regex: escapeRegex(search), $options: "i" } },
              ],
            },
          },
        ]
      : []),

    { $sort: { createdAt: -1 } },

    {
      $facet: {
        students: [
          { $skip: skip },
          { $limit: limit },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await StudentEnrollment.aggregate(pipeline);

  const students = result?.[0]?.students || [];
  const total = result?.[0]?.totalCount?.[0]?.count || 0;

  return res.status(200).json({
    success: true,
    data: students,   // ✅ IMPORTANT FIX
    pagination: {
      total,
      page,
      limit,
    },
  });
});

const getPromotionCandidates = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId || req.query.schoolId;
  const { schoolClassId, academicYearId } = req.query;

  if (!schoolId || !schoolClassId || !academicYearId) {
    throw new ApiError(400, "schoolClassId and academicYearId are required");
  }

  const students = await StudentEnrollment.find({
    schoolId,
    academicYearId,
    schoolClassId,
    status: "Active",
  })
    .populate({ path: "studentId", populate: { path: "userId", select: "name email", match: { isActive: true, isDeleted: { $ne: true } } } })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .sort({ registrationNumber: 1 });

  const data = students.map((enrollment) => ({
    enrollmentId: enrollment._id,
    studentId: enrollment.studentId?._id || null,
    name: enrollment.studentId?.userId?.name || "N/A",
    email: enrollment.studentId?.userId?.email || "",
    registrationNumber: enrollment.registrationNumber,
    currentClass: enrollment.schoolClassId?.name || "",
    currentSection: enrollment.sectionId?.name || "",
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { students: data }, "Promotion candidates fetched"));
});

const promoteStudentsToNextAcademicYear = asyncHandler(async (req, res) => {
  const schoolId = req.user?.schoolId || req.body.schoolId;
  const {
    fromAcademicYearId,
    toAcademicYearId,
    toSchoolClassId,
    toSectionId,
    enrollmentIds,
  } = req.body;

  if (!schoolId || !fromAcademicYearId || !toAcademicYearId || !toSchoolClassId || !toSectionId) {
    throw new ApiError(400, "fromAcademicYearId, toAcademicYearId, toSchoolClassId and toSectionId are required");
  }

  if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
    throw new ApiError(400, "Select at least one student for promotion");
  }

  const targetClass = await SchoolClass.findOne({
    _id: toSchoolClassId,
    schoolId,
    academicYearId: toAcademicYearId,
  }).select("_id");

  if (!targetClass) {
    throw new ApiError(404, "Target class not found in selected academic year");
  }

  const targetSection = await Section.findOne({
    _id: toSectionId,
    schoolId,
    schoolClassId: toSchoolClassId,
  }).select("_id");

  if (!targetSection) {
    throw new ApiError(404, "Target section not found for selected class");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sourceEnrollments = await StudentEnrollment.find({
      _id: { $in: enrollmentIds },
      schoolId,
      academicYearId: fromAcademicYearId,
      status: "Active",
    }).session(session);

    if (!sourceEnrollments.length) {
      throw new ApiError(404, "No valid active enrollments found for promotion");
    }

    const studentIds = sourceEnrollments.map((item) => item.studentId);

    const existingNextYear = await StudentEnrollment.find({
      studentId: { $in: studentIds },
      schoolId,
      academicYearId: toAcademicYearId,
    })
      .select("studentId")
      .session(session);

    const alreadyPromoted = new Set(existingNextYear.map((item) => String(item.studentId)));

    const promotable = sourceEnrollments.filter((item) => !alreadyPromoted.has(String(item.studentId)));

    if (!promotable.length) {
      throw new ApiError(409, "Selected students are already enrolled in target academic year");
    }

    const docsToCreate = promotable.map((item) => ({
      studentId: item.studentId,
      schoolId,
      academicYearId: toAcademicYearId,
      schoolClassId: toSchoolClassId,
      sectionId: toSectionId,
      registrationNumber: item.registrationNumber,
      mobileNumber: item.mobileNumber,
      feeDiscount: item.feeDiscount || 0,
      status: "Active",
    }));

    const createdEnrollments = await StudentEnrollment.insertMany(docsToCreate, { session });

    const promotedIds = promotable.map((item) => item._id);

    await StudentEnrollment.updateMany(
      { _id: { $in: promotedIds } },
      { $set: { status: "Promoted" } },
      { session }
    );

    await Section.updateOne(
      { _id: toSectionId },
      { $addToSet: { StudentEnrollmentId: { $each: createdEnrollments.map((item) => item._id) } } },
      { session }
    );

    await session.commitTransaction();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          promotedCount: createdEnrollments.length,
          skippedCount: sourceEnrollments.length - createdEnrollments.length,
          promotedEnrollmentIds: createdEnrollments.map((item) => item._id),
        },
        "Students promoted successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const getMyStudentEnrollmentId = asyncHandler(async (req, res) => {
  // 🔐 Step 1: Find student
  const student = await Student.findOne({ userId: req.user._id }).select("_id");

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  // 🔐 Step 2: Active academic year (optional fallback below)
  const activeAcademicYear = await AcademicYear.findOne({
    schoolId: req.user.schoolId,
    isActive: true,
  }).select("_id");

  // 🔐 Step 3: Enrollment
  let enrollment = await StudentEnrollment.findOne({
    studentId: student._id,
    schoolId: req.user.schoolId,
    ...(activeAcademicYear ? { academicYearId: activeAcademicYear._id } : {}),
  })
    .select("_id registrationNumber schoolClassId sectionId academicYearId")
    .sort({ createdAt: -1 })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .populate("academicYearId", "name"); // ✅ already populated

  // Fallback: student ka enrollment data hai but active year mismatch ho to latest enrollment do.
  if (!enrollment) {
    enrollment = await StudentEnrollment.findOne({
      studentId: student._id,
      schoolId: req.user.schoolId,
    })
      .select("_id registrationNumber schoolClassId sectionId academicYearId")
      .sort({ createdAt: -1 })
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .populate("academicYearId", "name");
  }

  if (!enrollment) {
    throw new ApiError(404, "Student enrollment not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        studentId: student._id,
        enrollmentId: enrollment._id,
        registrationNumber: enrollment.registrationNumber,

        schoolClass: enrollment.schoolClassId, // { _id, name }
        section: enrollment.sectionId,         // { _id, name }

        academicYear: enrollment.academicYearId, // ✅ FIXED (name bhi aayega)
      },
      "Student enrollment fetched successfully"
    )
  );
});

const getMyChildren = asyncHandler(async (req, res) => {
  const parentId = req.user?._id;
  const schoolId = req.user?.schoolId;

  const children = await Student.aggregate([
    {
      $match: {
        $or: [
          { fatherId: new mongoose.Types.ObjectId(parentId) },
          { motherId: new mongoose.Types.ObjectId(parentId) },
          { guardianId: new mongoose.Types.ObjectId(parentId) },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        let: { userRef: "$userId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userRef"] },
              isActive: true,
              isDeleted: { $ne: true },
            },
          },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "studentenrollments",
        let: { studentRef: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$studentId", "$$studentRef"] },
              schoolId: new mongoose.Types.ObjectId(schoolId),
              status: "Active",
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "enrollment",
      },
    },
    { $unwind: { path: "$enrollment", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "schoolclasses",
        localField: "enrollment.schoolClassId",
        foreignField: "_id",
        as: "schoolClass",
      },
    },
    { $unwind: { path: "$schoolClass", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "sections",
        localField: "enrollment.sectionId",
        foreignField: "_id",
        as: "section",
      },
    },
    { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        gender: 1,
        dateOfBirth: 1,
        bloodGroup: 1,
        enrollmentId: "$enrollment._id",
        registrationNumber: "$enrollment.registrationNumber",
        classId: "$schoolClass._id",
        className: "$schoolClass.name",
        sectionId: "$section._id",
        sectionName: "$section.name",
      },
    },
    { $sort: { name: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, children, "Parent children fetched successfully"));
});

/* ======================================================
   🔢 ROLL NUMBER MANAGEMENT
====================================================== */

/**
 * GET /student/roll-numbers?schoolId=&academicYearId=&schoolClassId=&sectionId=
 * Returns all students in a class-section with their roll numbers, sorted by roll number.
 */
const getClassRollNumbers = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId } = req.query;
  const schoolId = req.user?.schoolId || req.query.schoolId;

  if (!schoolId || !academicYearId || !schoolClassId || !sectionId) {
    throw new ApiError(400, "schoolId, academicYearId, schoolClassId and sectionId are required");
  }

  const enrollments = await StudentEnrollment.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
        schoolClassId: new mongoose.Types.ObjectId(schoolClassId),
        sectionId: new mongoose.Types.ObjectId(sectionId),
        status: "Active",
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $lookup: {
        from: "users",
        let: { userRef: "$student.userId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$userRef"] },
              isActive: true,
              isDeleted: { $ne: true },
            },
          },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        rollNumber: 1,
        registrationNumber: 1,
        admissionDate: 1,
        status: 1,
        studentId: "$student._id",
        studentName: "$user.name",
        email: "$user.email",
        gender: "$student.gender",
      },
    },
    { $sort: { rollNumber: 1, studentName: 1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { students: enrollments }, "Roll numbers fetched successfully"));
});

/**
 * PATCH /student/roll-number/:enrollmentId
 * Update roll number for a single student enrollment.
 */
const updateStudentRollNumber = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { rollNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
    throw new ApiError(400, "Invalid enrollment ID");
  }
  if (!rollNumber || typeof rollNumber !== "number" || rollNumber < 1) {
    throw new ApiError(400, "rollNumber must be a positive integer");
  }

  const enrollment = await StudentEnrollment.findById(enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, "Enrollment not found");
  }

  // Check for duplicate roll number in same class+section+year
  const duplicate = await StudentEnrollment.findOne({
    _id: { $ne: enrollmentId },
    schoolId: enrollment.schoolId,
    academicYearId: enrollment.academicYearId,
    schoolClassId: enrollment.schoolClassId,
    sectionId: enrollment.sectionId,
    rollNumber,
  });

  if (duplicate) {
    throw new ApiError(409, `Roll number ${rollNumber} is already assigned to another student in this class-section`);
  }

  enrollment.rollNumber = rollNumber;
  enrollment.updatedBy = req.user?._id || null;
  await enrollment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { enrollmentId, rollNumber }, "Roll number updated successfully"));
});

/**
 * POST /student/roll-numbers/auto-assign
 * Bulk auto-assign sequential roll numbers (1, 2, 3...) sorted alphabetically by student name.
 * Body: { schoolId, academicYearId, schoolClassId, sectionId }
 */
const bulkAutoAssignRollNumbers = asyncHandler(async (req, res) => {
  const { academicYearId, schoolClassId, sectionId } = req.body;
  const schoolId = req.user?.schoolId || req.body.schoolId;

  if (!schoolId || !academicYearId || !schoolClassId || !sectionId) {
    throw new ApiError(400, "schoolId, academicYearId, schoolClassId and sectionId are required");
  }

  // Get all active enrollments sorted by student name
  const enrollments = await StudentEnrollment.aggregate([
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(schoolId),
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
        schoolClassId: new mongoose.Types.ObjectId(schoolClassId),
        sectionId: new mongoose.Types.ObjectId(sectionId),
        status: "Active",
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },
    {
      $lookup: {
        from: "users",
        let: { userRef: "$student.userId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$userRef"] }, isActive: true, isDeleted: { $ne: true } } },
        ],
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $sort: { "user.name": 1 } },
    { $project: { _id: 1, studentName: "$user.name" } },
  ]);

  if (!enrollments.length) {
    throw new ApiError(404, "No active students found in this class-section");
  }

  // Bulk update each enrollment with sequential roll number
  const bulkOps = enrollments.map((enr, idx) => ({
    updateOne: {
      filter: { _id: enr._id },
      update: { $set: { rollNumber: idx + 1, updatedBy: req.user?._id || null } },
    },
  }));

  await StudentEnrollment.bulkWrite(bulkOps);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        assignedCount: enrollments.length,
        students: enrollments.map((e, i) => ({ enrollmentId: e._id, name: e.studentName, rollNumber: i + 1 })),
      },
      `Roll numbers auto-assigned to ${enrollments.length} students`
    )
  );
});

export {
  createStudentAdmission,
  bulkImportStudents,
  transferStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getLastRegisteredStudent,
  getStudentsBySchoolId,
  getPromotionCandidates,
  promoteStudentsToNextAcademicYear,
  getMyStudentEnrollmentId,
  getMyChildren,
  getClassRollNumbers,
  updateStudentRollNumber,
  bulkAutoAssignRollNumbers,
};

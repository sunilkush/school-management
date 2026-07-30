import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DisciplineIncident, DISCIPLINE_CATEGORIES } from "../models/DisciplineIncident.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { School } from "../models/school.model.js";
import { notifyUser } from "../utils/notifyService.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const resolveSchoolId = (req) =>
  req.user.roleId?.name === "Super Admin" ? req.query.schoolId || req.body.schoolId || req.user.schoolId : req.user.schoolId;

const ensureAccess = (doc, user, notFoundMessage) => {
  if (!doc) throw new ApiError(404, notFoundMessage);
  if (
    user.roleId?.name !== "Super Admin" &&
    `${doc.schoolId}` !== `${user.schoolId}`
  ) {
    throw new ApiError(403, "Forbidden for this school record");
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

export const createIncident = asyncHandler(async (req, res) => {
  const {
    studentId, incidentDate, category, description, severity, demeritPoints,
    actionTaken, witnesses, parentMeetingRequired, parentNotified, followUpDate,
  } = req.body;

  if (category && !DISCIPLINE_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Invalid discipline category");
  }

  const student = await Student.findById(studentId).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const school = await School.findById(schoolId).select("activeAcademicYearId").lean();
  const enrollment = await resolveStudentEnrollment(studentId, schoolId, school?.activeAcademicYearId);

  const incident = await DisciplineIncident.create({
    schoolId,
    studentId,
    studentName: student.userId?.name || "",
    className: enrollment?.schoolClassId?.name || "",
    sectionName: enrollment?.sectionId?.name || "",
    incidentDate: incidentDate || new Date(),
    category: category || "Behavior",
    description,
    severity: severity || "Minor",
    demeritPoints: demeritPoints ?? 0,
    actionTaken: actionTaken || "",
    witnesses: witnesses || [],
    parentMeetingRequired: !!parentMeetingRequired,
    parentNotified: !!parentNotified,
    parentNotifiedAt: parentNotified ? new Date() : null,
    followUpDate: followUpDate || null,
    reportedBy: req.user._id,
  });

  // Auto-notify parents for anything beyond a Minor incident — a staff member shouldn't have to
  // remember to separately message home for the cases that actually matter.
  if (incident.severity === "Moderate" || incident.severity === "Major") {
    const parentIds = [student.fatherId, student.motherId, student.guardianId].filter(Boolean);
    if (parentIds.length) {
      const title = `Discipline notice: ${incident.studentName}`;
      const message = `A ${incident.severity.toLowerCase()} ${incident.category.toLowerCase()} incident has been recorded for ${incident.studentName}: ${incident.description}`;

      await Promise.all(
        parentIds.map((parentId) =>
          notifyUser({
            schoolId,
            userId: parentId,
            title,
            message,
            channels: { inApp: true, email: true, sms: true, whatsapp: true },
            createdById: req.user._id,
          })
        )
      );

      incident.parentNotified = true;
      incident.parentNotifiedAt = new Date();
      await incident.save();
    }
  }

  return res.status(201).json(new ApiResponse(201, incident, "Discipline incident recorded successfully"));
});

export const getIncidents = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { studentId, status, severity, category, search, from, to, page, limit, sort } = req.query;

  const filter = { schoolId };
  if (studentId) filter.studentId = studentId;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (category) filter.category = category;
  if (from || to) {
    filter.incidentDate = {};
    if (from) filter.incidentDate.$gte = new Date(from);
    if (to) filter.incidentDate.$lte = new Date(to);
  }
  if (search) {
    filter.studentName = new RegExp(escapeRegex(search.trim()), "i");
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;
  const sortBy = sort ? sort.split(",").join(" ") : "-incidentDate";

  const [incidents, total] = await Promise.all([
    DisciplineIncident.find(filter).sort(sortBy).skip(skip).limit(limitNum).lean(),
    DisciplineIncident.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      incidents,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) || 1 },
    }, "Discipline incidents fetched successfully")
  );
});

export const getIncidentById = asyncHandler(async (req, res) => {
  const incident = await DisciplineIncident.findById(req.params.id).lean();
  ensureAccess(incident, req.user, "Discipline incident not found");

  return res.status(200).json(new ApiResponse(200, incident, "Discipline incident fetched successfully"));
});

export const updateIncident = asyncHandler(async (req, res) => {
  const incident = await DisciplineIncident.findById(req.params.id);
  ensureAccess(incident, req.user, "Discipline incident not found");

  const {
    actionTaken, severity, demeritPoints, parentMeetingRequired, parentNotified,
    followUpDate, status, resolutionNotes,
  } = req.body;

  if (actionTaken !== undefined) incident.actionTaken = actionTaken;
  if (severity !== undefined) incident.severity = severity;
  if (demeritPoints !== undefined) incident.demeritPoints = demeritPoints;
  if (parentMeetingRequired !== undefined) incident.parentMeetingRequired = parentMeetingRequired;
  if (followUpDate !== undefined) incident.followUpDate = followUpDate;
  if (resolutionNotes !== undefined) incident.resolutionNotes = resolutionNotes;

  if (parentNotified !== undefined && parentNotified && !incident.parentNotified) {
    incident.parentNotified = true;
    incident.parentNotifiedAt = new Date();
  } else if (parentNotified !== undefined) {
    incident.parentNotified = parentNotified;
  }

  if (status !== undefined && status !== incident.status) {
    incident.status = status;
    if (status === "Resolved") {
      incident.resolvedBy = req.user._id;
      incident.resolvedAt = new Date();
    } else {
      incident.resolvedBy = null;
      incident.resolvedAt = null;
    }
  }

  await incident.save();

  return res.status(200).json(new ApiResponse(200, incident, "Discipline incident updated successfully"));
});

export const getStudentDisciplineSummary = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const student = await Student.findById(studentId).select("schoolId").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const schoolId = req.user.roleId?.name === "Super Admin" ? student.schoolId : req.user.schoolId;
  if (`${student.schoolId}` !== `${schoolId}`) throw new ApiError(403, "Forbidden for this school student");

  const [summary] = await DisciplineIncident.aggregate([
    { $match: { schoolId: student.schoolId, studentId: student._id } },
    {
      $group: {
        _id: null,
        totalIncidents: { $sum: 1 },
        totalDemeritPoints: { $sum: "$demeritPoints" },
        openIncidents: { $sum: { $cond: [{ $eq: ["$status", "Open"] }, 1, 0] } },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, summary || { totalIncidents: 0, totalDemeritPoints: 0, openIncidents: 0 }, "Discipline summary fetched successfully")
  );
});

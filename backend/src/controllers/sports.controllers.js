import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SportsTeam, SPORTS_TEAM_CATEGORIES } from "../models/SportsTeam.model.js";
import { SportsEvent, SPORTS_EVENT_TYPES } from "../models/SportsEvent.model.js";
import { Achievement, ACHIEVEMENT_HOLDER_TYPES, ACHIEVEMENT_LEVELS } from "../models/Achievement.model.js";
import { Student } from "../models/student.model.js";

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

/* ══════════════════════════ Teams ══════════════════════════ */

export const createTeam = asyncHandler(async (req, res) => {
  const { name, category, sportType, coachId, academicYearId } = req.body;

  if (category && !SPORTS_TEAM_CATEGORIES.includes(category)) {
    throw new ApiError(400, "Invalid category");
  }

  const schoolId = resolveSchoolId(req);
  const team = await SportsTeam.create({
    schoolId, name, category: category || "Sport", sportType: sportType || "",
    coachId: coachId || null, academicYearId: academicYearId || null, createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, team, "Team created successfully"));
});

export const getTeams = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { category, academicYearId, coachId } = req.query;

  const filter = { schoolId };
  if (category) filter.category = category;
  if (academicYearId) filter.academicYearId = academicYearId;
  if (coachId) filter.coachId = coachId;

  const teams = await SportsTeam.find(filter).populate("coachId", "name").sort({ name: 1 }).lean();

  return res.status(200).json(new ApiResponse(200, teams, "Teams fetched successfully"));
});

export const getTeamById = asyncHandler(async (req, res) => {
  const team = await SportsTeam.findById(req.params.id).populate("coachId", "name").lean();
  ensureAccess(team, req.user, "Team not found");

  return res.status(200).json(new ApiResponse(200, team, "Team fetched successfully"));
});

export const updateTeam = asyncHandler(async (req, res) => {
  const team = await SportsTeam.findById(req.params.id);
  ensureAccess(team, req.user, "Team not found");

  const { name, category, sportType, coachId, isActive } = req.body;
  if (name !== undefined) team.name = name;
  if (category !== undefined) {
    if (!SPORTS_TEAM_CATEGORIES.includes(category)) throw new ApiError(400, "Invalid category");
    team.category = category;
  }
  if (sportType !== undefined) team.sportType = sportType;
  if (coachId !== undefined) team.coachId = coachId;
  if (isActive !== undefined) team.isActive = isActive;

  await team.save();

  return res.status(200).json(new ApiResponse(200, team, "Team updated successfully"));
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await SportsTeam.findById(req.params.id);
  ensureAccess(team, req.user, "Team not found");

  await SportsTeam.findByIdAndDelete(req.params.id);

  return res.status(200).json(new ApiResponse(200, { _id: req.params.id }, "Team deleted successfully"));
});

export const addTeamMember = asyncHandler(async (req, res) => {
  const { studentId, position } = req.body;

  const team = await SportsTeam.findById(req.params.id);
  ensureAccess(team, req.user, "Team not found");

  if (team.members.some((m) => `${m.studentId}` === `${studentId}`)) {
    throw new ApiError(400, "Student is already a member of this team");
  }

  const student = await Student.findById(studentId).populate("userId", "name").lean();
  if (!student) throw new ApiError(404, "Student not found");

  team.members.push({ studentId, studentName: student.userId?.name || "", position: position || "", joinedDate: new Date() });
  await team.save();

  return res.status(200).json(new ApiResponse(200, team, "Member added successfully"));
});

export const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await SportsTeam.findById(req.params.id);
  ensureAccess(team, req.user, "Team not found");

  team.members = team.members.filter((m) => `${m.studentId}` !== `${req.params.studentId}`);
  await team.save();

  return res.status(200).json(new ApiResponse(200, team, "Member removed successfully"));
});

/* ══════════════════════════ Events ══════════════════════════ */

export const createEvent = asyncHandler(async (req, res) => {
  const { title, teamId, eventType, opponent, eventDate, venue, result, scoreDetails, participants, notes } = req.body;

  if (eventType && !SPORTS_EVENT_TYPES.includes(eventType)) {
    throw new ApiError(400, "Invalid event type");
  }

  const schoolId = resolveSchoolId(req);
  const event = await SportsEvent.create({
    schoolId, title, teamId: teamId || null, eventType: eventType || "Match",
    opponent: opponent || "", eventDate: eventDate || new Date(), venue: venue || "",
    result: result || "Pending", scoreDetails: scoreDetails || "",
    participants: participants || [], notes: notes || "", createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, event, "Event created successfully"));
});

export const getEvents = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { teamId, eventType, result, from, to } = req.query;

  const filter = { schoolId };
  if (teamId) filter.teamId = teamId;
  if (eventType) filter.eventType = eventType;
  if (result) filter.result = result;
  if (from || to) {
    filter.eventDate = {};
    if (from) filter.eventDate.$gte = new Date(from);
    if (to) filter.eventDate.$lte = new Date(to);
  }

  const events = await SportsEvent.find(filter).populate("teamId", "name").sort({ eventDate: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, events, "Events fetched successfully"));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await SportsEvent.findById(req.params.id);
  ensureAccess(event, req.user, "Event not found");

  const { title, opponent, venue, result, scoreDetails, notes } = req.body;
  if (title !== undefined) event.title = title;
  if (opponent !== undefined) event.opponent = opponent;
  if (venue !== undefined) event.venue = venue;
  if (result !== undefined) event.result = result;
  if (scoreDetails !== undefined) event.scoreDetails = scoreDetails;
  if (notes !== undefined) event.notes = notes;

  await event.save();

  return res.status(200).json(new ApiResponse(200, event, "Event updated successfully"));
});

/* ══════════════════════════ Achievements ══════════════════════════ */

export const createAchievement = asyncHandler(async (req, res) => {
  const { holderType, studentId, teamId, title, level, position, eventName, achievementDate, description, certificateUrl } = req.body;

  if (!ACHIEVEMENT_HOLDER_TYPES.includes(holderType)) throw new ApiError(400, "Invalid holder type");
  if (level && !ACHIEVEMENT_LEVELS.includes(level)) throw new ApiError(400, "Invalid level");

  const schoolId = resolveSchoolId(req);
  let holderName = "";

  if (holderType === "Student") {
    if (!studentId) throw new ApiError(400, "studentId is required for a student achievement");
    const student = await Student.findById(studentId).populate("userId", "name").lean();
    if (!student) throw new ApiError(404, "Student not found");
    holderName = student.userId?.name || "";
  } else {
    if (!teamId) throw new ApiError(400, "teamId is required for a team achievement");
    const team = await SportsTeam.findById(teamId).lean();
    if (!team) throw new ApiError(404, "Team not found");
    holderName = team.name;
  }

  const achievement = await Achievement.create({
    schoolId, holderType, studentId: studentId || null, teamId: teamId || null, holderName,
    title, level: level || "School", position: position || "", eventName: eventName || "",
    achievementDate: achievementDate || new Date(), description: description || "",
    certificateUrl: certificateUrl || "", recordedBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, achievement, "Achievement recorded successfully"));
});

export const getAchievements = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { holderType, studentId, teamId, level, search, from, to } = req.query;

  const filter = { schoolId };
  if (holderType) filter.holderType = holderType;
  if (studentId) filter.studentId = studentId;
  if (teamId) filter.teamId = teamId;
  if (level) filter.level = level;
  if (from || to) {
    filter.achievementDate = {};
    if (from) filter.achievementDate.$gte = new Date(from);
    if (to) filter.achievementDate.$lte = new Date(to);
  }
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ holderName: regex }, { title: regex }];
  }

  const achievements = await Achievement.find(filter).sort({ achievementDate: -1 }).lean();

  return res.status(200).json(new ApiResponse(200, achievements, "Achievements fetched successfully"));
});

export const deleteAchievement = asyncHandler(async (req, res) => {
  const achievement = await Achievement.findById(req.params.id);
  ensureAccess(achievement, req.user, "Achievement not found");

  await Achievement.findByIdAndDelete(req.params.id);

  return res.status(200).json(new ApiResponse(200, { _id: req.params.id }, "Achievement deleted successfully"));
});

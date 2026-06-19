import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sendSuccess = (res, data, message = "Success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

/* ── Haversine distance in metres ── */
function haversineMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const ROLE_MAP = {
  "Super Admin": "super_admin",
  "School Admin": "school_admin",
  Admin: "admin",
  Principal: "principal",
  "Vice Principal": "vice_principal",
  Teacher: "teacher",
  "Subject Coordinator": "subject_coordinator",
  Student: "student",
  Parent: "parent",
  Accountant: "accountant",
  Staff: "staff",
  "Support Staff": "support_staff",
  Librarian: "librarian",
  "Hostel Warden": "hostel_warden",
  "Transport Manager": "transport_manager",
  "Exam Coordinator": "exam_coordinator",
  Receptionist: "receptionist",
  "IT Support": "it_support",
  Counselor: "counselor",
  Security: "security",
};

/* ── helpers ── */
function todayUTC() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/* ═══════════════════════════════════════════
   GET  /self/status  — today's record for me
═══════════════════════════════════════════ */
export const getSelfStatus = asyncHandler(async (req, res) => {
  const { schoolId, _id: userId } = req.user;
  const date = todayUTC();

  const record = await Attendance.findOne({ schoolId, userId, date }).lean();
  const school = await School.findById(schoolId)
    .select("location name")
    .lean();

  sendSuccess(res, { record, school }, "Self-attendance status fetched");
});

/* ═══════════════════════════════════════════
   POST /self/check-in
   body: { lat, lng, accuracy? }
═══════════════════════════════════════════ */
export const checkIn = asyncHandler(async (req, res) => {
  const { schoolId, _id: userId } = req.user;
  const roleName = req.userRole?.name;
  const { lat, lng, accuracy } = req.body;

  if (lat == null || lng == null) throw new ApiError(400, "GPS coordinates required");

  const school = await School.findById(schoolId).select("location").lean();
  if (!school) throw new ApiError(404, "School not found");

  let gpsVerified = false;
  let distanceFromSchool = null;

  if (school.location?.lat != null && school.location?.lng != null) {
    distanceFromSchool = Math.round(
      haversineMetres(lat, lng, school.location.lat, school.location.lng)
    );
    const radius = school.location.geofenceRadius || 200;
    if (distanceFromSchool > radius) {
      throw new ApiError(
        403,
        `You are ${distanceFromSchool}m from school. Geofence radius is ${radius}m.`
      );
    }
    gpsVerified = true;
  }

  const date = todayUTC();
  const role = ROLE_MAP[roleName] || "staff";
  const now = new Date();

  let record = await Attendance.findOne({ schoolId, userId, date });

  if (record) {
    if (record.checkInAt) throw new ApiError(409, "Already checked in today");
    record.checkInAt = now;
    record.checkInGps = { lat, lng, accuracy: accuracy || null };
    record.gpsVerified = gpsVerified;
    record.distanceFromSchool = distanceFromSchool;
    record.status = "present";
  } else {
    record = new Attendance({
      schoolId,
      userId,
      role,
      date,
      status: "present",
      markedBy: userId,
      checkInAt: now,
      checkInGps: { lat, lng, accuracy: accuracy || null },
      gpsVerified,
      distanceFromSchool,
    });
  }

  await record.save();
  sendSuccess(res, record, "Check-in successful", 201);
});

/* ═══════════════════════════════════════════
   POST /self/check-out
   body: { lat, lng, accuracy? }
═══════════════════════════════════════════ */
export const checkOut = asyncHandler(async (req, res) => {
  const { schoolId, _id: userId } = req.user;
  const { lat, lng, accuracy } = req.body;

  if (lat == null || lng == null) throw new ApiError(400, "GPS coordinates required");

  const school = await School.findById(schoolId).select("location").lean();
  if (!school) throw new ApiError(404, "School not found");

  const date = todayUTC();
  const record = await Attendance.findOne({ schoolId, userId, date });
  if (!record) throw new ApiError(404, "No check-in found for today");
  if (!record.checkInAt) throw new ApiError(400, "Must check in before checking out");
  if (record.checkOutAt) throw new ApiError(409, "Already checked out today");

  let distanceFromSchool = null;
  if (school.location?.lat != null && school.location?.lng != null) {
    distanceFromSchool = Math.round(
      haversineMetres(lat, lng, school.location.lat, school.location.lng)
    );
    const radius = school.location.geofenceRadius || 200;
    if (distanceFromSchool > radius) {
      throw new ApiError(
        403,
        `You are ${distanceFromSchool}m from school. Geofence radius is ${radius}m.`
      );
    }
  }

  record.checkOutAt = new Date();
  record.checkOutGps = { lat, lng, accuracy: accuracy || null };
  await record.save();

  const durationMs = record.checkOutAt - record.checkInAt;
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);

  sendSuccess(res, { record, duration: { hours, minutes } }, "Check-out successful");
});

/* ═══════════════════════════════════════════
   GET  /self/history?month=YYYY-MM
═══════════════════════════════════════════ */
export const getSelfHistory = asyncHandler(async (req, res) => {
  const { schoolId, _id: userId } = req.user;
  const { month } = req.query; // "2025-06"

  let from, to;
  if (month) {
    from = new Date(`${month}-01T00:00:00.000Z`);
    to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + 1);
  } else {
    from = new Date();
    from.setUTCDate(1);
    from.setUTCHours(0, 0, 0, 0);
    to = new Date(from);
    to.setUTCMonth(to.getUTCMonth() + 1);
  }

  const records = await Attendance.find({
    schoolId,
    userId,
    date: { $gte: from, $lt: to },
  })
    .sort({ date: 1 })
    .lean();

  sendSuccess(res, records, "Self attendance history fetched");
});

/* ═══════════════════════════════════════════
   GET  /self/geofence  — school GPS settings
═══════════════════════════════════════════ */
export const getGeofenceSettings = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const school = await School.findById(schoolId).select("name location").lean();
  if (!school) throw new ApiError(404, "School not found");
  sendSuccess(res, school, "Geofence settings fetched");
});

/* ═══════════════════════════════════════════
   PUT  /self/geofence  — admin update GPS
   body: { lat, lng, geofenceRadius, address? }
═══════════════════════════════════════════ */
export const updateGeofenceSettings = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { lat, lng, geofenceRadius, address } = req.body;

  if (lat == null || lng == null) throw new ApiError(400, "lat and lng are required");
  if (geofenceRadius != null && geofenceRadius < 50)
    throw new ApiError(400, "Geofence radius must be at least 50 metres");

  const update = {
    "location.lat": lat,
    "location.lng": lng,
  };
  if (geofenceRadius != null) update["location.geofenceRadius"] = geofenceRadius;
  if (address != null) update["location.address"] = address;

  const school = await School.findByIdAndUpdate(
    schoolId,
    { $set: update },
    { new: true, select: "name location" }
  ).lean();

  if (!school) throw new ApiError(404, "School not found");
  sendSuccess(res, school, "Geofence settings updated");
});

/* ═══════════════════════════════════════════
   GET  /self/live-dashboard  — admin view
   today's check-in summary across all staff
═══════════════════════════════════════════ */
export const getLiveDashboard = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const date = todayUTC();

  const records = await Attendance.find({ schoolId, date })
    .populate("userId", "name email")
    .select("userId role status checkInAt checkOutAt gpsVerified distanceFromSchool")
    .lean();

  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    late: records.filter((r) => r.status === "late").length,
    checkedIn: records.filter((r) => r.checkInAt).length,
    checkedOut: records.filter((r) => r.checkOutAt).length,
    gpsVerified: records.filter((r) => r.gpsVerified).length,
  };

  sendSuccess(res, { summary, records }, "Live dashboard fetched");
});

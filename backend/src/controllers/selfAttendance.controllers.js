import { Attendance } from "../models/attendance.model.js";
import { School } from "../models/school.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { describeWorked, statusFromWorkedHours } from "../services/workHours.service.js";

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

export const ROLE_MAP = {
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

// "HH:mm" for right now, in the timezone school hours are configured in (Asia/Kolkata) —
// the server's own local time zone may not match, so this can't just use Date#getHours().
function nowInIst() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = parts.find((p) => p.type === "hour").value;
  const mm = parts.find((p) => p.type === "minute").value;
  return `${hh}:${mm}`;
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

  const school = await School.findById(schoolId).select("location attendanceHours").lean();
  if (!school) throw new ApiError(404, "School not found");

  const { startTime = "08:00", endTime = "15:00" } = school.attendanceHours || {};
  const nowHm = nowInIst();
  if (nowHm < startTime || nowHm > endTime) {
    throw new ApiError(403, `Check-in is only allowed during school hours (${startTime}–${endTime}).`);
  }

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

  // Looking for today's record and then writing it were separate steps, so tapping Check in
  // twice — or a phone retrying on a bad connection — got past the "already checked in" reply:
  // both requests found no record and both tried to create one, and the second was answered
  // with a duplicate-key 500 rather than being told they were already in. One statement now
  // takes today's record, or makes it, only while no check-in is recorded against it.
  let record;
  try {
    record = await Attendance.findOneAndUpdate(
      { schoolId, userId, date, checkInAt: null },
      {
        $set: {
          checkInAt: now,
          checkInGps: { lat, lng, accuracy: accuracy || null },
          gpsVerified,
          distanceFromSchool,
          status: "present",
        },
        $setOnInsert: { role, markedBy: userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
  } catch (error) {
    // The filter did not match because a check-in is already recorded, so the upsert tried to
    // add a second record for the day and the unique index refused it.
    if (error?.code === 11000) throw new ApiError(409, "Already checked in today");
    throw error;
  }

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

  const school = await School.findById(schoolId).select("location attendanceHours").lean();
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

  // Only while no check-out is recorded yet — the checks above and the save were separate
  // steps, so a second tap got past "Already checked out today" and moved the time.
  const checkedOut = await Attendance.findOneAndUpdate(
    { _id: record._id, schoolId, checkOutAt: null },
    { $set: { checkOutAt: new Date(), checkOutGps: { lat, lng, accuracy: accuracy || null } } },
    { new: true, runValidators: true }
  );
  if (!checkedOut) throw new ApiError(409, "Already checked out today");

  // The hours worked decide the day: full, half (first or second half) or absent.
  const outcome = statusFromWorkedHours(checkedOut, school.attendanceHours);
  checkedOut.status = outcome.status;
  checkedOut.halfDaySession = outcome.halfDaySession;
  checkedOut.remarks = describeWorked(outcome);
  await checkedOut.save();

  const durationMs = checkedOut.checkOutAt - checkedOut.checkInAt;
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);

  sendSuccess(res, { record: checkedOut, duration: { hours, minutes } }, "Check-out successful");
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
   GET  /self/geofence  — school GPS + attendance-hours settings
═══════════════════════════════════════════ */
export const getGeofenceSettings = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const school = await School.findById(schoolId).select("name location attendanceHours leavePolicy").lean();
  if (!school) throw new ApiError(404, "School not found");
  sendSuccess(res, school, "Geofence settings fetched");
});

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/; // "HH:mm", 24-hour

/* ═══════════════════════════════════════════
   PUT  /self/geofence  — admin update GPS + attendance hours
   body: { lat, lng, geofenceRadius, address?, startTime?, endTime?, autoCheckoutEnabled? }
═══════════════════════════════════════════ */
export const updateGeofenceSettings = asyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { lat, lng, geofenceRadius, address, startTime, endTime, autoCheckoutEnabled, autoAbsentEnabled, halfDayHours, fullDayHours, clPerMonth, elPerMonth } = req.body;

  if (lat == null || lng == null) throw new ApiError(400, "lat and lng are required");
  if (!(Number(lat) >= -90 && Number(lat) <= 90) || !(Number(lng) >= -180 && Number(lng) <= 180)) {
    throw new ApiError(400, "lat must be between -90 and 90 and lng between -180 and 180");
  }
  if (geofenceRadius != null && geofenceRadius < 50)
    throw new ApiError(400, "Geofence radius must be at least 50 metres");
  if (startTime != null && !TIME_RE.test(startTime)) throw new ApiError(400, "startTime must be in HH:mm format");
  if (endTime != null && !TIME_RE.test(endTime)) throw new ApiError(400, "endTime must be in HH:mm format");
  if (startTime != null && endTime != null && endTime <= startTime)
    throw new ApiError(400, "endTime must be after startTime");

  const update = {
    "location.lat": lat,
    "location.lng": lng,
  };
  if (geofenceRadius != null) update["location.geofenceRadius"] = geofenceRadius;
  if (address != null) update["location.address"] = address;
  if (startTime != null) update["attendanceHours.startTime"] = startTime;
  if (endTime != null) update["attendanceHours.endTime"] = endTime;
  if (autoCheckoutEnabled != null) update["attendanceHours.autoCheckoutEnabled"] = autoCheckoutEnabled;
  if (autoAbsentEnabled != null) update["attendanceHours.autoAbsentEnabled"] = autoAbsentEnabled === true;
  const hoursOk = (v) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 24;
  const perMonthOk = (v) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 31;
  if (halfDayHours != null && !hoursOk(halfDayHours)) throw new ApiError(400, "halfDayHours must be 0–24");
  if (fullDayHours != null && !hoursOk(fullDayHours)) throw new ApiError(400, "fullDayHours must be 0–24");
  if (halfDayHours != null && fullDayHours != null && Number(halfDayHours) > Number(fullDayHours)) {
    throw new ApiError(400, "Half-day hours cannot be more than full-day hours");
  }
  if (clPerMonth != null && !perMonthOk(clPerMonth)) throw new ApiError(400, "CL per month must be 0–31");
  if (elPerMonth != null && !perMonthOk(elPerMonth)) throw new ApiError(400, "EL per month must be 0–31");
  if (halfDayHours != null) update["attendanceHours.halfDayHours"] = Number(halfDayHours);
  if (fullDayHours != null) update["attendanceHours.fullDayHours"] = Number(fullDayHours);
  if (clPerMonth != null) update["leavePolicy.clPerMonth"] = Number(clPerMonth);
  if (elPerMonth != null) update["leavePolicy.elPerMonth"] = Number(elPerMonth);

  const school = await School.findByIdAndUpdate(
    schoolId,
    { $set: update },
    { new: true, select: "name location attendanceHours leavePolicy" }
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

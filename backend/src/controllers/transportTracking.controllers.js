import mongoose from "mongoose";

import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { StudentTransportAssignment } from "../models/StudentTransportAssignment.model.js";
import { Transport } from "../models/Transport.model.js";
import { TransportRoute } from "../models/TransportRoute.model.js";
import { TransportTrip } from "../models/TransportTrip.model.js";
import { VehicleLocation } from "../models/VehicleLocation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";
import { etaToStop, recordPing, tripSnapshot } from "../services/transportTracking.service.js";

/**
 * Live bus tracking.
 *
 * A trip is started by whoever is driving it, pinged while it runs, and ended when the bus is
 * back. Everything a parent, driver or office sees is derived from the same trip document, so
 * the three views cannot show different answers to "where is the bus".
 */

const requireSchool = (req) => {
  const schoolId = resolveSchoolId(req.user);
  if (!schoolId) throw new ApiError(400, "School context not found");
  return schoolId;
};

/** Midnight of the given day, so a day's trips group cleanly whatever time they started. */
const startOfDay = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid date");
  d.setHours(0, 0, 0, 0);
  return d;
};

const MANAGER_ROLES = new Set(["super admin", "school admin", "transport manager"]);
const isManager = (req) => MANAGER_ROLES.has((req.userRole?.name || "").toLowerCase().trim());

/** The trip, scoped to the caller's school so no id from another tenant can be reached. */
const loadTrip = async (req, id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid trip id");
  const trip = await TransportTrip.findOne({ _id: id, schoolId: requireSchool(req) });
  if (!trip) throw new ApiError(404, "Trip not found");
  return trip;
};

/* ── Running a trip ──────────────────────────────────────────────── */

export const startTrip = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { routeId, vehicleId, direction, serviceDate, academicYearId } = req.body;

  if (!["pickup", "drop"].includes(direction)) {
    throw new ApiError(400, "Direction must be either pickup or drop");
  }

  const [route, vehicle] = await Promise.all([
    TransportRoute.findOne({ _id: routeId, schoolId }).lean(),
    Transport.findOne({ _id: vehicleId, schoolId }).lean(),
  ]);
  if (!route) throw new ApiError(404, "Route not found");
  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  // A driver may only start a run on a bus that is actually theirs. Without this any driver
  // account could open a trip on another route and start feeding it positions.
  if (!isManager(req) && String(vehicle.driverId || "") !== String(req.user._id)) {
    throw new ApiError(403, "This vehicle is not assigned to you");
  }

  const day = startOfDay(serviceDate);

  try {
    const trip = await TransportTrip.create({
      schoolId,
      academicYearId: academicYearId || route.academicYearId || null,
      routeId: route._id,
      vehicleId: vehicle._id,
      driverId: vehicle.driverId || req.user._id,
      serviceDate: day,
      direction,
      status: "running",
      startedAt: new Date(),
      startedBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, tripSnapshot(trip, route), "Trip started"));
  } catch (error) {
    // The unique index is what actually prevents two drivers running the same route twice in a
    // day — checking first and then creating would still race between the two requests.
    if (error?.code === 11000) {
      throw new ApiError(409, "This route already has a trip for that direction today");
    }
    throw error;
  }
});

export const pingTrip = asyncHandler(async (req, res) => {
  const trip = await loadTrip(req, req.params.id);

  if (!isManager(req) && String(trip.driverId || "") !== String(req.user._id)) {
    throw new ApiError(403, "You are not driving this trip");
  }

  const { lat, lng, speedKph, headingDeg, recordedAt } = req.body;
  const at = recordedAt ? new Date(recordedAt) : new Date();
  if (Number.isNaN(at.getTime())) throw new ApiError(400, "Invalid recordedAt");

  const route = await TransportRoute.findById(trip.routeId).lean();
  const result = await recordPing({
    trip,
    route,
    fix: { lat, lng, speedKph, headingDeg },
    recordedAt: at,
  });

  // A rejected ping is reported, not thrown: a driver app that pinged a beat too early or sent a
  // bad fix should keep running, and the reason is more useful than a 4xx it will just retry.
  return res.json(
    new ApiResponse(
      200,
      {
        accepted: result.accepted,
        reason: result.reason || null,
        arrivals: result.arrivals,
        trip: tripSnapshot(result.trip, route),
      },
      result.accepted ? "Location recorded" : result.reason
    )
  );
});

export const endTrip = asyncHandler(async (req, res) => {
  const trip = await loadTrip(req, req.params.id);

  if (!isManager(req) && String(trip.driverId || "") !== String(req.user._id)) {
    throw new ApiError(403, "You are not driving this trip");
  }
  if (trip.status !== "running") throw new ApiError(400, `This trip is already ${trip.status}`);

  trip.status = req.body.cancelled ? "cancelled" : "completed";
  trip.endedAt = new Date();
  trip.endedBy = req.user._id;
  await trip.save();

  const route = await TransportRoute.findById(trip.routeId).lean();
  return res.json(new ApiResponse(200, tripSnapshot(trip, route), `Trip ${trip.status}`));
});

/* ── Watching ────────────────────────────────────────────────────── */

export const getLiveTrips = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);

  const trips = await TransportTrip.find({ schoolId, status: "running" })
    .sort({ startedAt: -1 })
    .lean();

  const routes = await TransportRoute.find({
    schoolId,
    _id: { $in: trips.map((t) => t.routeId) },
  }).lean();
  const routeById = new Map(routes.map((r) => [String(r._id), r]));

  const data = trips.map((trip) => {
    const route = routeById.get(String(trip.routeId));
    return {
      ...tripSnapshot(trip, route),
      // A "running" trip that has never pinged is a driver who did not grant location access. It
      // looks identical to a parked bus on a map, so it is called out rather than left to guess.
      isReporting: Boolean(trip.lastLocation),
      stopsTotal: route?.stopPoints?.length || 0,
    };
  });

  return res.json(new ApiResponse(200, data, "Live trips fetched"));
});

/**
 * The caller's own open trip, if any.
 *
 * Exists so a driver who reloaded the page can pick their run back up without being given the
 * office-wide live view — and without starting a second trip, which the unique index refuses.
 */
export const getMyTrip = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);

  const trip = await TransportTrip.findOne({ schoolId, driverId: req.user._id, status: "running" })
    .sort({ startedAt: -1 })
    .lean();

  if (!trip) return res.json(new ApiResponse(200, null, "No trip is running"));

  const route = await TransportRoute.findById(trip.routeId).lean();
  return res.json(new ApiResponse(200, tripSnapshot(trip, route), "Trip fetched"));
});

export const listTrips = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const { routeId, direction, from, to, status } = req.query;

  const filter = { schoolId };
  if (routeId) filter.routeId = routeId;
  if (direction) filter.direction = direction;
  if (status) filter.status = status;
  if (from || to) {
    filter.serviceDate = {
      ...(from ? { $gte: startOfDay(from) } : {}),
      ...(to ? { $lte: startOfDay(to) } : {}),
    };
  }

  const trips = await TransportTrip.find(filter)
    .populate("routeId", "name bus")
    .sort({ serviceDate: -1, startedAt: -1 })
    .limit(200)
    .lean();

  return res.json(new ApiResponse(200, trips, "Trips fetched"));
});

export const getTripTrail = asyncHandler(async (req, res) => {
  const trip = await loadTrip(req, req.params.id);
  const route = await TransportRoute.findById(trip.routeId).lean();

  const trail = await VehicleLocation.find({ tripId: trip._id })
    .select("lat lng speedKph headingDeg recordedAt")
    .sort({ recordedAt: 1 })
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { trip: tripSnapshot(trip, route), stops: route?.stopPoints || [], trail },
      "Trip trail fetched"
    )
  );
});

/* ── The parent's view ───────────────────────────────────────────── */

/** Whose bus the caller is allowed to ask about. A parent may only ask about their own child. */
const resolveStudentUserId = async (req) => {
  const role = (req.userRole?.name || "").toLowerCase().trim();
  if (role === "student") return req.user._id;

  const { childId } = req.query;
  if (!childId) throw new ApiError(400, "childId is required");
  const child = await Student.findOne({
    userId: childId,
    $or: [{ fatherId: req.user._id }, { motherId: req.user._id }, { guardianId: req.user._id }],
  }).select("_id");
  if (!child) throw new ApiError(403, "You are not authorised to track this child");
  return childId;
};

export const getMyBus = asyncHandler(async (req, res) => {
  const schoolId = requireSchool(req);
  const studentUserId = await resolveStudentUserId(req);

  const student = await Student.findOne({ userId: studentUserId, schoolId }).select("_id").lean();
  if (!student) throw new ApiError(404, "Student not found");

  const enrollments = await StudentEnrollment.find({ studentId: student._id, schoolId })
    .select("_id")
    .lean();

  const assignment = await StudentTransportAssignment.findOne({
    schoolId,
    studentEnrollmentId: { $in: enrollments.map((e) => e._id) },
    isActive: true,
  }).lean();

  if (!assignment) {
    return res.json(new ApiResponse(200, { assigned: false }, "This student does not use school transport"));
  }

  const route = await TransportRoute.findOne({ _id: assignment.routeId, schoolId }).lean();
  const trip = await TransportTrip.findOne({
    schoolId,
    routeId: assignment.routeId,
    status: "running",
  })
    .sort({ startedAt: -1 })
    .lean();

  if (!trip) {
    return res.json(
      new ApiResponse(
        200,
        { assigned: true, running: false, routeName: route?.name || null, vehicleId: assignment.vehicleId },
        "The bus is not running right now"
      )
    );
  }

  // Which of the student's two stops matters depends on the direction the bus is going.
  const wantedStop = trip.direction === "pickup" ? assignment.pickupStop : assignment.dropStop;
  const matched = (route?.stopPoints || []).find(
    (s) => s.name.trim().toLowerCase() === String(wantedStop || "").trim().toLowerCase()
  );

  const eta = matched
    ? etaToStop({ trip, route, targetSequence: matched.sequence })
    : {
        available: false,
        // Said plainly, because the fix is an office task: put the stop on the map.
        reason: wantedStop
          ? `"${wantedStop}" is not on the route map yet, so no arrival time can be worked out`
          : "No stop is recorded for this student",
      };

  return res.json(
    new ApiResponse(
      200,
      {
        assigned: true,
        running: true,
        stopName: wantedStop || null,
        stopSequence: matched?.sequence ?? null,
        // The route is sent along so the parent's map can draw where the bus is going, not just
        // a dot floating on a blank map. These stops are already public knowledge to a family
        // using the route.
        stops: route?.stopPoints || [],
        eta,
        ...tripSnapshot(trip, route),
      },
      "Bus located"
    )
  );
});

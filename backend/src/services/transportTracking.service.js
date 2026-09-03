import { TransportTrip } from "../models/TransportTrip.model.js";
import { VehicleLocation } from "../models/VehicleLocation.model.js";

/**
 * Live bus tracking: what to do with a location ping, and how to answer "when will it reach my
 * stop".
 *
 * Everything here is deliberately straight-line geometry. There is no routing engine and no map
 * provider in this project, so an ETA is an estimate from distance and recent speed, and it says
 * so in its own payload (`isEstimate`). Dressing that up as a real road ETA would be the actual
 * mistake — a parent trusts a number that says 4 minutes.
 */

const EARTH_RADIUS_M = 6371000;

/** Great-circle distance in metres. */
export const distanceMeters = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h))));
};

/** A ping closer than this to the previous one is dropped. A driver app that fires every second
 *  would otherwise write ~30,000 rows per bus per day for no extra useful detail. */
export const MIN_PING_GAP_SECONDS = 5;

/** Below this we treat the bus as stopped and refuse to divide by it when estimating an ETA. */
const MIN_USABLE_SPEED_KPH = 5;
/** Used when there is no usable speed reading yet — roughly urban school-bus pace. */
const ASSUMED_SPEED_KPH = 20;

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

/** Rejects a fix that cannot be real. A garbage coordinate would put the bus in the ocean and
 *  poison every distance and ETA computed from it, so it never gets stored. */
export const validateFix = ({ lat, lng, speedKph, headingDeg }) => {
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
  if (!isFiniteNumber(lng) || lng < -180 || lng > 180) return "Longitude must be between -180 and 180";
  if (speedKph != null && (!isFiniteNumber(speedKph) || speedKph < 0)) return "Speed cannot be negative";
  if (headingDeg != null && (!isFiniteNumber(headingDeg) || headingDeg < 0 || headingDeg > 360)) {
    return "Heading must be between 0 and 360";
  }
  return null;
};

/**
 * Stops the bus has just reached.
 *
 * Any stop inside its own radius counts, not only the next one in sequence: a single missed GPS
 * window near a stop would otherwise leave it permanently unmarked, and a parent watching for
 * "arrived" would wait for a message that can never come. A stop already recorded is never
 * recorded again, so passing back through one on a loop does not produce a second arrival.
 */
export const detectStopArrivals = ({ route, trip, fix, at }) => {
  const already = new Set((trip.stopArrivals || []).map((s) => s.sequence));

  return (route?.stopPoints || [])
    .filter((stop) => !already.has(stop.sequence))
    .filter((stop) => distanceMeters(fix, stop) <= (stop.radiusMeters ?? 150))
    .map((stop) => {
      const expected =
        stop.expectedOffsetMin != null && trip.startedAt
          ? new Date(new Date(trip.startedAt).getTime() + stop.expectedOffsetMin * 60000)
          : null;

      return {
        name: stop.name,
        sequence: stop.sequence,
        arrivedAt: at,
        lat: fix.lat,
        lng: fix.lng,
        delayMin: expected ? Math.round((at.getTime() - expected.getTime()) / 60000) : null,
      };
    });
};

/**
 * Records one fix against a running trip.
 *
 * Returns `{ accepted, reason?, trip, arrivals }`. A dropped ping is not an error — the driver
 * app should not have to care that it pinged a little too eagerly.
 */
export const recordPing = async ({ trip, route, fix, recordedAt = new Date() }) => {
  if (trip.status !== "running") {
    return { accepted: false, reason: "This trip is not running", trip, arrivals: [] };
  }

  const problem = validateFix(fix);
  if (problem) return { accepted: false, reason: problem, trip, arrivals: [] };

  const previous = trip.lastLocation?.recordedAt ? new Date(trip.lastLocation.recordedAt) : null;
  const gapSeconds = previous ? (recordedAt.getTime() - previous.getTime()) / 1000 : null;

  // A fix older than the one already stored is a late upload — a driver coming out of a tunnel
  // flushing a backlog. It is real history and belongs in the trail, so it is NOT throttled;
  // the throttle exists only to thin out a chatty app sending the same moment over and over.
  const isNewest = gapSeconds === null || gapSeconds >= 0;

  if (isNewest && gapSeconds !== null && gapSeconds < MIN_PING_GAP_SECONDS) {
    return { accepted: false, reason: "Ping ignored — too soon after the last one", trip, arrivals: [] };
  }

  await VehicleLocation.create({
    schoolId: trip.schoolId,
    tripId: trip._id,
    vehicleId: trip.vehicleId,
    lat: fix.lat,
    lng: fix.lng,
    speedKph: fix.speedKph ?? null,
    headingDeg: fix.headingDeg ?? null,
    recordedAt,
  });

  const arrivals = isNewest ? detectStopArrivals({ route, trip, fix, at: recordedAt }) : [];

  const update = { $inc: { pingCount: 1 } };
  if (isNewest) {
    update.$set = {
      lastLocation: {
        lat: fix.lat,
        lng: fix.lng,
        speedKph: fix.speedKph ?? null,
        headingDeg: fix.headingDeg ?? null,
        recordedAt,
      },
    };
  }
  if (arrivals.length) update.$push = { stopArrivals: { $each: arrivals } };

  const updated = await TransportTrip.findByIdAndUpdate(trip._id, update, { new: true });
  return { accepted: true, trip: updated, arrivals };
};

/**
 * Distance and time from where the bus is now to one stop, following the remaining stops in
 * order rather than cutting straight across — a bus does not fly to the last stop.
 */
export const etaToStop = ({ trip, route, targetSequence }) => {
  const fix = trip.lastLocation;
  if (!fix) return { available: false, reason: "The bus has not reported a position yet" };

  const arrived = new Set((trip.stopArrivals || []).map((s) => s.sequence));
  if (arrived.has(targetSequence)) {
    const hit = trip.stopArrivals.find((s) => s.sequence === targetSequence);
    return { available: false, reason: "Already reached", arrivedAt: hit?.arrivedAt || null };
  }

  const remaining = (route?.stopPoints || [])
    .filter((s) => !arrived.has(s.sequence) && s.sequence <= targetSequence)
    .sort((a, b) => a.sequence - b.sequence);

  if (!remaining.length) return { available: false, reason: "That stop is not on this route" };

  let metres = 0;
  let from = { lat: fix.lat, lng: fix.lng };
  for (const stop of remaining) {
    metres += distanceMeters(from, stop);
    from = stop;
  }

  const speed = isFiniteNumber(fix.speedKph) && fix.speedKph >= MIN_USABLE_SPEED_KPH ? fix.speedKph : ASSUMED_SPEED_KPH;

  return {
    available: true,
    distanceMeters: metres,
    minutes: Math.max(1, Math.round((metres / 1000 / speed) * 60)),
    stopsAway: remaining.length,
    // Straight lines between stops and a flat speed — good enough to decide when to leave the
    // house, not good enough to quote to the minute. The caller shows it as "about".
    isEstimate: true,
  };
};

/** The shape every "where is the bus" response uses, so the parent, driver and admin views can
 *  never disagree about what a trip looks like. */
export const tripSnapshot = (trip, route) => ({
  tripId: trip._id,
  routeId: trip.routeId?._id || trip.routeId,
  routeName: route?.name || trip.routeId?.name || null,
  vehicleId: trip.vehicleId?._id || trip.vehicleId,
  direction: trip.direction,
  status: trip.status,
  startedAt: trip.startedAt,
  endedAt: trip.endedAt,
  lastLocation: trip.lastLocation || null,
  stopArrivals: trip.stopArrivals || [],
  pingCount: trip.pingCount || 0,
  // Says outright when a route cannot produce arrivals, instead of quietly never firing any.
  hasMappedStops: Boolean(route?.stopPoints?.length),
});

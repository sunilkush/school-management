import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app.js';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../helpers/testDb.js';
import {
  createSchool, createRole, createUser, createStudent,
  createActiveAcademicYear, createEnrollment, loginAs,
} from '../helpers/fixtures.js';
import { Transport } from '../../src/models/Transport.model.js';
import { TransportRoute } from '../../src/models/TransportRoute.model.js';
import { TransportTrip } from '../../src/models/TransportTrip.model.js';
import { StudentTransportAssignment } from '../../src/models/StudentTransportAssignment.model.js';
import { VehicleLocation } from '../../src/models/VehicleLocation.model.js';
import { Student } from '../../src/models/student.model.js';
import { Role } from '../../src/models/Roles.model.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearTestDb);

let seq = 0;

/* Three stops roughly 1 km apart on a straight line — far enough that a fix at one is nowhere
   near the next, so an arrival test proves detection rather than coincidence. */
const STOPS = [
  { name: 'Gandhi Chowk', sequence: 0, lat: 26.9124, lng: 75.7873, radiusMeters: 150, expectedOffsetMin: 5 },
  { name: 'Civil Lines', sequence: 1, lat: 26.9214, lng: 75.7873, radiusMeters: 150 },
  { name: 'School Gate', sequence: 2, lat: 26.9304, lng: 75.7873, radiusMeters: 150 },
];

/* roleMiddleware matches on the exact role name, and Roles is unique on {name, schoolId} — so a
   second Driver in the same school has to reuse that school's Driver role, not get its own. */
const roleFor = async (name, schoolId) =>
  (await Role.findOne({ name, schoolId })) || createRole(name, { schoolId });

const mkUser = async (roleName, schoolId, extra = {}) => {
  seq += 1;
  const role = await roleFor(roleName, schoolId);
  const { user } = await createUser({
    name: roleName, email: `${roleName.toLowerCase().replace(/ /g, '')}-${seq}-${Date.now()}@bus.test`,
    roleId: role._id, schoolId, ...extra,
  });
  return { user, token: await loginAs(user.email) };
};

/** A school with a mapped route, a bus, its driver, and an admin. */
const scaffold = async () => {
  const school = await createSchool();
  const admin = await mkUser('School Admin', school._id);
  const driver = await mkUser('Driver', school._id);

  const route = await TransportRoute.create({
    schoolId: school._id, name: `Route ${++seq}`, bus: 'RJ14-1234',
    stops: STOPS.map((s) => s.name), stopPoints: STOPS,
  });
  const vehicle = await Transport.create({
    schoolId: school._id, busNumber: `RJ14-${seq}`, driverName: 'Ramesh',
    driverId: driver.user._id, capacity: 40,
  });

  return { school, admin, driver, route, vehicle };
};

const startTrip = (ctx, actor = ctx.driver, body = {}) =>
  request(app).post('/api/v1/transport/trips').set('Authorization', `Bearer ${actor.token}`)
    .send({ routeId: ctx.route._id, vehicleId: ctx.vehicle._id, direction: 'pickup', ...body });

const ping = (tripId, actor, body) =>
  request(app).post(`/api/v1/transport/trips/${tripId}/ping`)
    .set('Authorization', `Bearer ${actor.token}`).send(body);

/** A student on this route, plus the parent allowed to track them. */
const enrolStudentOnRoute = async (ctx, { pickupStop = 'Civil Lines' } = {}) => {
  const parent = await mkUser('Parent', ctx.school._id);
  const child = await mkUser('Student', ctx.school._id);
  const year = await createActiveAcademicYear({ schoolId: ctx.school._id });

  const student = await createStudent({ userId: child.user._id, schoolId: ctx.school._id });
  await Student.updateOne({ _id: student._id }, { fatherId: parent.user._id });

  const enrollment = await createEnrollment({
    studentId: student._id, schoolId: ctx.school._id, academicYearId: year._id,
  });
  await StudentTransportAssignment.create({
    schoolId: ctx.school._id, academicYearId: year._id, studentEnrollmentId: enrollment._id,
    routeId: ctx.route._id, vehicleId: ctx.vehicle._id, pickupStop, dropStop: pickupStop,
  });

  return { parent, child };
};

describe('starting a trip', () => {
  it('lets the assigned driver start their own run', async () => {
    const ctx = await scaffold();

    const res = await startTrip(ctx);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('running');
    expect(res.body.data.hasMappedStops).toBe(true);
  }, 25000);

  it('refuses a driver who is not on that bus', async () => {
    const ctx = await scaffold();
    const other = await mkUser('Driver', ctx.school._id);

    const res = await startTrip(ctx, other);

    expect(res.status).toBe(403);
    expect(await TransportTrip.countDocuments({})).toBe(0);
  }, 25000);

  it('refuses a second trip for the same route and direction on the same day', async () => {
    const ctx = await scaffold();
    await startTrip(ctx);

    const again = await startTrip(ctx, ctx.admin);

    // Two trips would split the trail, leaving "where is the bus" with two answers.
    expect(again.status).toBe(409);
    expect(await TransportTrip.countDocuments({})).toBe(1);
  }, 25000);

  it('allows the opposite direction on the same day', async () => {
    const ctx = await scaffold();
    await startTrip(ctx);

    const drop = await startTrip(ctx, ctx.driver, { direction: 'drop' });

    expect(drop.status).toBe(201);
  }, 25000);

  it('will not start a trip on another school route', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();

    const res = await request(app).post('/api/v1/transport/trips')
      .set('Authorization', `Bearer ${mine.admin.token}`)
      .send({ routeId: theirs.route._id, vehicleId: theirs.vehicle._id, direction: 'pickup' });

    expect(res.status).toBe(404);
  }, 25000);
});

describe('location pings', () => {
  it('records a fix and moves the bus', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;

    const res = await ping(trip.tripId, ctx.driver, { lat: 26.9000, lng: 75.7873, speedKph: 24 });

    expect(res.body.data.accepted).toBe(true);
    expect(res.body.data.trip.lastLocation.lat).toBe(26.9);
    expect(await VehicleLocation.countDocuments({ tripId: trip.tripId })).toBe(1);
  }, 25000);

  it('drops a fix that cannot be real instead of storing it', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;

    const res = await ping(trip.tripId, ctx.driver, { lat: 999, lng: 75.7873 });

    // A bad coordinate would poison every distance and ETA computed from it.
    expect(res.body.data.accepted).toBe(false);
    expect(res.body.data.reason).toMatch(/Latitude/);
    expect(await VehicleLocation.countDocuments({})).toBe(0);
  }, 25000);

  it('ignores a ping that arrives too soon after the last one', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    const now = new Date();

    await ping(trip.tripId, ctx.driver, { lat: 26.90, lng: 75.7873, recordedAt: now.toISOString() });
    const second = await ping(trip.tripId, ctx.driver, {
      lat: 26.901, lng: 75.7873, recordedAt: new Date(now.getTime() + 1000).toISOString(),
    });

    expect(second.body.data.accepted).toBe(false);
    expect(await VehicleLocation.countDocuments({})).toBe(1);
  }, 25000);

  it('does not let a late fix walk the bus backwards', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    const now = new Date();

    await ping(trip.tripId, ctx.driver, { lat: 26.92, lng: 75.7873, recordedAt: now.toISOString() });
    const stale = await ping(trip.tripId, ctx.driver, {
      lat: 26.80, lng: 75.7873, recordedAt: new Date(now.getTime() - 60000).toISOString(),
    });

    // The older fix is kept in the trail but must not become the current position.
    expect(stale.body.data.accepted).toBe(true);
    expect(stale.body.data.trip.lastLocation.lat).toBe(26.92);
    expect(await VehicleLocation.countDocuments({})).toBe(2);
  }, 25000);

  it('refuses a driver pinging somebody else trip', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    const other = await mkUser('Driver', ctx.school._id);

    const res = await ping(trip.tripId, other, { lat: 26.90, lng: 75.7873 });

    expect(res.status).toBe(403);
  }, 25000);

  it('cannot reach a trip belonging to another school', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    const trip = (await startTrip(theirs)).body.data;

    const res = await ping(trip.tripId, mine.admin, { lat: 26.90, lng: 75.7873 });

    expect(res.status).toBe(404);
  }, 25000);

  it('will not accept a ping once the trip has ended', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    await request(app).post(`/api/v1/transport/trips/${trip.tripId}/end`)
      .set('Authorization', `Bearer ${ctx.driver.token}`).send({});

    const res = await ping(trip.tripId, ctx.driver, { lat: 26.90, lng: 75.7873 });

    expect(res.body.data.accepted).toBe(false);
  }, 25000);
});

describe('stop arrivals', () => {
  it('marks a stop reached when the bus gets inside its radius', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;

    const res = await ping(trip.tripId, ctx.driver, { lat: 26.9124, lng: 75.7873, speedKph: 10 });

    expect(res.body.data.arrivals).toHaveLength(1);
    expect(res.body.data.arrivals[0].name).toBe('Gandhi Chowk');
    expect(res.body.data.arrivals[0].delayMin).toEqual(expect.any(Number));
  }, 25000);

  it('does not mark the same stop twice', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    const now = new Date();

    await ping(trip.tripId, ctx.driver, { lat: 26.9124, lng: 75.7873, recordedAt: now.toISOString() });
    const again = await ping(trip.tripId, ctx.driver, {
      lat: 26.9124, lng: 75.7873, recordedAt: new Date(now.getTime() + 30000).toISOString(),
    });

    expect(again.body.data.arrivals).toHaveLength(0);
    const stored = await TransportTrip.findById(trip.tripId).lean();
    expect(stored.stopArrivals).toHaveLength(1);
  }, 25000);

  it('leaves distant stops alone', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;

    const res = await ping(trip.tripId, ctx.driver, { lat: 26.8000, lng: 75.7873 });

    expect(res.body.data.arrivals).toHaveLength(0);
  }, 25000);

  it('says outright when a route has no stops on the map', async () => {
    const ctx = await scaffold();
    await TransportRoute.updateOne({ _id: ctx.route._id }, { stopPoints: [] });
    const trip = (await startTrip(ctx)).body.data;

    const res = await ping(trip.tripId, ctx.driver, { lat: 26.9124, lng: 75.7873 });

    // Better than silently never firing an arrival and letting the office assume it works.
    expect(res.body.data.trip.hasMappedStops).toBe(false);
    expect(res.body.data.arrivals).toHaveLength(0);
  }, 25000);
});

describe('the driver own view', () => {
  it('hands a driver back the run they already have open', async () => {
    const ctx = await scaffold();
    const started = (await startTrip(ctx)).body.data;

    const res = await request(app).get('/api/v1/transport/trips/mine')
      .set('Authorization', `Bearer ${ctx.driver.token}`);

    // Without this a driver who reloaded would try to start a second trip, which is refused.
    expect(String(res.body.data.tripId)).toBe(String(started.tripId));
  }, 25000);

  it('returns nothing for a driver with no run open', async () => {
    const ctx = await scaffold();

    const res = await request(app).get('/api/v1/transport/trips/mine')
      .set('Authorization', `Bearer ${ctx.driver.token}`);

    expect(res.body.data).toBeNull();
  }, 25000);

  it('lets a driver read the routes so they can pick the one they are running', async () => {
    const ctx = await scaffold();

    const res = await request(app).get('/api/v1/transport/routes')
      .set('Authorization', `Bearer ${ctx.driver.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  }, 25000);

  it('still keeps the office-wide live view away from a driver', async () => {
    const ctx = await scaffold();

    const res = await request(app).get('/api/v1/transport/trips/live')
      .set('Authorization', `Bearer ${ctx.driver.token}`);

    expect(res.status).toBe(403);
  }, 25000);
});

describe('watching', () => {
  it('lists running trips and flags one that is not reporting', async () => {
    const ctx = await scaffold();
    await startTrip(ctx);

    const res = await request(app).get('/api/v1/transport/trips/live')
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    expect(res.body.data).toHaveLength(1);
    // A running trip with no fix looks exactly like a parked bus on a map, so it is called out.
    expect(res.body.data[0].isReporting).toBe(false);
    expect(res.body.data[0].stopsTotal).toBe(3);
  }, 25000);

  it('returns the trail in the order it was travelled', async () => {
    const ctx = await scaffold();
    const trip = (await startTrip(ctx)).body.data;
    const now = new Date();

    await ping(trip.tripId, ctx.driver, { lat: 26.90, lng: 75.7873, recordedAt: now.toISOString() });
    await ping(trip.tripId, ctx.driver, { lat: 26.91, lng: 75.7873, recordedAt: new Date(now.getTime() + 30000).toISOString() });

    const res = await request(app).get(`/api/v1/transport/trips/${trip.tripId}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`);

    expect(res.body.data.trail.map((p) => p.lat)).toEqual([26.9, 26.91]);
    expect(res.body.data.stops).toHaveLength(3);
  }, 25000);

  it('does not show another school live trips', async () => {
    const mine = await scaffold();
    const theirs = await scaffold();
    await startTrip(theirs);

    const res = await request(app).get('/api/v1/transport/trips/live')
      .set('Authorization', `Bearer ${mine.admin.token}`);

    expect(res.body.data).toHaveLength(0);
  }, 25000);
});

describe('mapping stops', () => {
  const saveRoute = (ctx, body) =>
    request(app).put(`/api/v1/transport/routes/${ctx.route._id}`)
      .set('Authorization', `Bearer ${ctx.admin.token}`).send(body);

  it('derives the plain stop list from the mapped stops', async () => {
    const ctx = await scaffold();

    const res = await saveRoute(ctx, {
      stopPoints: [
        { name: 'Alpha', lat: 26.90, lng: 75.78, sequence: 0 },
        { name: 'Beta', lat: 26.91, lng: 75.78, sequence: 1 },
      ],
    });

    // One source of truth: the two lists can never describe different stops.
    expect(res.body.data.stops).toEqual(['Alpha', 'Beta']);
    expect(res.body.data.stopPoints).toHaveLength(2);
  }, 25000);

  it('drops a mapped stop that has been removed from the plain list', async () => {
    const ctx = await scaffold();

    const res = await saveRoute(ctx, { stops: ['Gandhi Chowk', 'School Gate'] });

    // Otherwise the deleted stop would keep firing arrivals under a name the route no longer has.
    expect(res.body.data.stopPoints.map((p) => p.name)).toEqual(['Gandhi Chowk', 'School Gate']);
    expect(res.body.data.stopPoints.map((p) => p.sequence)).toEqual([0, 1]);
  }, 25000);

  it('leaves a newly named stop unmapped rather than inventing coordinates for it', async () => {
    const ctx = await scaffold();

    const res = await saveRoute(ctx, { stops: [...STOPS.map((s) => s.name), 'Brand New Stop'] });

    expect(res.body.data.stops).toHaveLength(4);
    expect(res.body.data.stopPoints).toHaveLength(3);
  }, 25000);
});

describe('the parent view', () => {
  it('gives a parent their child bus and an estimated arrival', async () => {
    const ctx = await scaffold();
    const { parent, child } = await enrolStudentOnRoute(ctx);
    const trip = (await startTrip(ctx)).body.data;
    await ping(trip.tripId, ctx.driver, { lat: 26.9100, lng: 75.7873, speedKph: 20 });

    const res = await request(app)
      .get(`/api/v1/transport/trips/my-bus?childId=${child.user._id}`)
      .set('Authorization', `Bearer ${parent.token}`);

    expect(res.body.data.running).toBe(true);
    expect(res.body.data.stopName).toBe('Civil Lines');
    expect(res.body.data.eta.available).toBe(true);
    expect(res.body.data.eta.minutes).toBeGreaterThan(0);
    // Straight lines and a flat speed — never presented as a real road ETA.
    expect(res.body.data.eta.isEstimate).toBe(true);
  }, 25000);

  it('refuses a parent asking about a child that is not theirs', async () => {
    const ctx = await scaffold();
    const { child } = await enrolStudentOnRoute(ctx);
    const stranger = await mkUser('Parent', ctx.school._id);

    const res = await request(app)
      .get(`/api/v1/transport/trips/my-bus?childId=${child.user._id}`)
      .set('Authorization', `Bearer ${stranger.token}`);

    expect(res.status).toBe(403);
  }, 25000);

  it('says the bus is not running rather than showing a stale position', async () => {
    const ctx = await scaffold();
    const { parent, child } = await enrolStudentOnRoute(ctx);

    const res = await request(app)
      .get(`/api/v1/transport/trips/my-bus?childId=${child.user._id}`)
      .set('Authorization', `Bearer ${parent.token}`);

    expect(res.body.data.assigned).toBe(true);
    expect(res.body.data.running).toBe(false);
    expect(res.body.data.lastLocation).toBeUndefined();
  }, 25000);

  it('explains itself when the child stop is not on the map', async () => {
    const ctx = await scaffold();
    const { parent, child } = await enrolStudentOnRoute(ctx, { pickupStop: 'Some Unmapped Corner' });
    const trip = (await startTrip(ctx)).body.data;
    await ping(trip.tripId, ctx.driver, { lat: 26.9100, lng: 75.7873, speedKph: 20 });

    const res = await request(app)
      .get(`/api/v1/transport/trips/my-bus?childId=${child.user._id}`)
      .set('Authorization', `Bearer ${parent.token}`);

    expect(res.body.data.eta.available).toBe(false);
    expect(res.body.data.eta.reason).toMatch(/not on the route map/);
  }, 25000);

  it('says so when the student does not use school transport', async () => {
    const ctx = await scaffold();
    const parent = await mkUser('Parent', ctx.school._id);
    const child = await mkUser('Student', ctx.school._id);
    const student = await createStudent({ userId: child.user._id, schoolId: ctx.school._id });
    await Student.updateOne({ _id: student._id }, { motherId: parent.user._id });

    const res = await request(app)
      .get(`/api/v1/transport/trips/my-bus?childId=${child.user._id}`)
      .set('Authorization', `Bearer ${parent.token}`);

    expect(res.body.data.assigned).toBe(false);
  }, 25000);
});

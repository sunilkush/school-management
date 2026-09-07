/**
 * Demo data for the modules the main seeder does not cover.
 *
 * Run: node scripts/seedDemoModules.mjs
 *
 * src/seed.js builds the school, people, classes, fees, exams, payroll and transport. Everything
 * added since then — the ledger, live bus tracking, attendance readers, government compliance,
 * online classes, report card templates — has no data at all, so those screens open empty and a
 * demo of them shows nothing. This fills them in.
 *
 * Two rules it follows throughout:
 *
 *   Everything is anchored to TODAY, not to fixed dates. A demo has to look alive whenever it is
 *   given: the bus is running now, a class starts this afternoon, this morning's card scans are
 *   in. Hard-coded dates make a demo look abandoned within a week.
 *
 *   Some records are left deliberately incomplete. The compliance readiness report, the
 *   reconciliation screen and the unmatched-scan list exist to show a school what still needs
 *   doing — seeding everything perfectly would make all three render as empty success screens and
 *   demo nothing at all.
 *
 * Safe to re-run: every step checks before it creates.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import crypto from "crypto";

import { School } from "../src/models/school.model.js";
import { User } from "../src/models/user.model.js";
import { Role } from "../src/models/Roles.model.js";
import { Student } from "../src/models/student.model.js";
import { StudentEnrollment } from "../src/models/StudentEnrollment.model.js";
import { AcademicYear } from "../src/models/AcademicYear.model.js";
import { Subject } from "../src/models/subject.model.js";
import { Exam } from "../src/models/exam.model.js";
import { Income } from "../src/models/Income.model.js";
import { Expense } from "../src/models/Expense.model.js";
import { Transport } from "../src/models/Transport.model.js";
import { TransportRoute } from "../src/models/TransportRoute.model.js";
import { TransportTrip } from "../src/models/TransportTrip.model.js";
import { VehicleLocation } from "../src/models/VehicleLocation.model.js";
import { AttendanceDevice, generateDeviceCredentials } from "../src/models/AttendanceDevice.model.js";
import { AttendanceCredential } from "../src/models/AttendanceCredential.model.js";
import { OnlineClass } from "../src/models/OnlineClass.model.js";
import { OnlineClassJoin } from "../src/models/OnlineClassJoin.model.js";
import { ReportCardTemplate } from "../src/models/ReportCardTemplate.model.js";
import { JournalEntry } from "../src/models/JournalEntry.model.js";
import { LedgerAccount } from "../src/models/LedgerAccount.model.js";

import { seedChartOfAccounts } from "../src/services/ledger.service.js";
import { postPendingEvents, reconciliationReport } from "../src/services/ledgerPosting.service.js";
import { ingestPunches, applyPunches } from "../src/services/devicePunch.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const URI = process.env.MONGOOSE_URI;
if (!URI) {
  console.error("MONGOOSE_URI not found in .env");
  process.exit(1);
}

const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const step = (n, title) => console.log(`\n${"─".repeat(58)}\n${n}  ${title}`);

const minutesAgo = (n) => new Date(Date.now() - n * 60000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const atHourToday = (hh, mm = 0) => {
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
};
const startOfDay = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};
const pick = (arr, n) => arr.slice(0, n);

/* ── Route stops, on the map ──────────────────────────────────────
   The base seeder names its routes after Delhi districts, so these are real Delhi coordinates.
   Without them a bus can be watched moving but no stop arrival can ever be detected. */
const ROUTE_STOPS = {
  "Route A – South Delhi": [
    { name: "Saket Metro", lat: 28.5245, lng: 77.2066, expectedOffsetMin: 0 },
    { name: "Malviya Nagar", lat: 28.5355, lng: 77.2135, expectedOffsetMin: 8 },
    { name: "Hauz Khas", lat: 28.5494, lng: 77.2001, expectedOffsetMin: 17 },
    { name: "Green Park", lat: 28.5601, lng: 77.2065, expectedOffsetMin: 24 },
    { name: "School Gate", lat: 28.5710, lng: 77.2120, expectedOffsetMin: 32 },
  ],
  "Route B – West Delhi": [
    { name: "Janakpuri West", lat: 28.6290, lng: 77.0782, expectedOffsetMin: 0 },
    { name: "Tilak Nagar", lat: 28.6396, lng: 77.0956, expectedOffsetMin: 10 },
    { name: "Rajouri Garden", lat: 28.6492, lng: 77.1200, expectedOffsetMin: 19 },
    { name: "School Gate", lat: 28.5710, lng: 77.2120, expectedOffsetMin: 35 },
  ],
  "Route C – East Delhi": [
    { name: "Laxmi Nagar", lat: 28.6304, lng: 77.2777, expectedOffsetMin: 0 },
    { name: "Preet Vihar", lat: 28.6412, lng: 77.2955, expectedOffsetMin: 9 },
    { name: "Anand Vihar", lat: 28.6469, lng: 77.3159, expectedOffsetMin: 16 },
    { name: "School Gate", lat: 28.5710, lng: 77.2120, expectedOffsetMin: 38 },
  ],
};

/** Points between two stops, so a trail looks like a bus on a road rather than a straight jump. */
const between = (a, b, count) =>
  Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    return {
      lat: a.lat + (b.lat - a.lat) * t,
      lng: a.lng + (b.lng - a.lng) * t,
    };
  });

export async function main() {
  console.log("\n🚀  Demo data for the newer modules");
  console.log("─".repeat(58));

  await mongoose.connect(URI);
  ok(`Connected to ${mongoose.connection.name}`);

  /* ══ Context ══════════════════════════════════════════════════ */
  step("📋", "Finding the school");

  const adminRole = await Role.findOne({ name: "School Admin" });
  if (!adminRole) {
    console.error("No 'School Admin' role found — run `node src/seed.js` first.");
    process.exit(1);
  }
  const admin = await User.findOne({ roleId: adminRole._id });
  if (!admin) {
    console.error("No School Admin user found — run `node src/seed.js` first.");
    process.exit(1);
  }

  const schoolId = admin.schoolId;
  const school = await School.findById(schoolId);
  const year = await AcademicYear.findOne({ schoolId, isActive: true })
    || await AcademicYear.findOne({ schoolId });
  if (!year) {
    console.error("No academic year found — run `node src/seed.js` first.");
    process.exit(1);
  }

  ok(`${school.name} · ${year.name}`);

  /* ══ 1. Government compliance ═════════════════════════════════ */
  step("🛡️ ", "Government compliance (UDISE+ / PEN / APAAR / RTE)");

  school.compliance = {
    ...(school.compliance?.toObject?.() || school.compliance || {}),
    udiseCode: school.compliance?.udiseCode || "07010200123",
    affiliationBoard: school.compliance?.affiliationBoard || "CBSE",
    affiliationNumber: school.compliance?.affiliationNumber || "2730123",
    recognitionNumber: school.compliance?.recognitionNumber || "DE/REC/2011/0456",
    management: school.compliance?.management || "Private Unaided",
    rteQuotaPercent: school.compliance?.rteQuotaPercent ?? 25,
  };
  await school.save();
  ok("School UDISE code and affiliation set");

  const students = await Student.find({ schoolId, status: "active" }).limit(200);
  const CATEGORIES = ["General", "OBC", "SC", "ST"];
  const TONGUES = ["Hindi", "Hindi", "English", "Punjabi", "Bengali"];

  let filled = 0;
  let leftIncomplete = 0;
  let rte = 0;

  for (const [i, student] of students.entries()) {
    if (student.compliance?.pen) continue;

    // Every fifth child is left short of something on purpose. The Readiness report is the whole
    // point of this module — seeded perfectly, it would show a green screen and demo nothing.
    const incomplete = i % 5 === 4;
    const isRte = i % 9 === 0;

    student.compliance = {
      ...(student.compliance?.toObject?.() || {}),
      pen: incomplete ? "" : String(11111111111 + i),
      socialCategory: CATEGORIES[i % CATEGORIES.length],
      minorityGroup: "None",
      motherTongue: incomplete ? "" : TONGUES[i % TONGUES.length],
      aadhaarOnFile: !incomplete,
      aadhaarLast4: incomplete ? "" : String(1000 + (i % 9000)),
      cwsn: i % 23 === 0,
      bplCard: isRte,
      rteAdmission: isRte,
      rteCategory: isRte ? "EWS" : "",
      // Consent recorded for most, so the APAAR panel shows all three states at once.
      apaarConsent: i % 3 === 0 ? { given: true, givenAt: daysAgo(30), recordedBy: admin._id } : { given: false, givenAt: null, recordedBy: null },
      apaarId: i % 3 === 0 && !incomplete ? String(123456789012 + i) : "",
      updatedAt: new Date(),
      updatedBy: admin._id,
    };
    await student.save();

    if (incomplete) leftIncomplete += 1; else filled += 1;
    if (isRte) rte += 1;
  }
  ok(`${filled} student records completed, ${leftIncomplete} left with gaps on purpose, ${rte} marked RTE`);

  /* ══ 2. Accounting ════════════════════════════════════════════ */
  step("🏦", "Accounting — chart, income, expenses, posting");

  const chart = await seedChartOfAccounts({ schoolId, createdBy: admin._id });
  ok(chart.created ? `${chart.created} ledger accounts created` : "Chart of accounts already complete");

  const INCOME = [
    { title: "Annual day ticket sales", category: "Donation", amount: 48000, paymentMode: "cash", ago: 21 },
    { title: "Summer camp fees", category: "Miscellaneous", amount: 125000, paymentMode: "bank_transfer", ago: 14 },
    { title: "Alumni contribution", category: "Donation", amount: 75000, paymentMode: "online", ago: 9 },
    { title: "Auditorium hire", category: "Rental Income", amount: 30000, paymentMode: "bank_transfer", ago: 4 },
  ];
  const EXPENSES = [
    { title: "Electricity — last month", category: "Utility Bills", amount: 86500, paymentMode: "bank_transfer", ago: 20 },
    { title: "Building rent", category: "Rent", amount: 210000, paymentMode: "bank_transfer", ago: 18 },
    { title: "Lab equipment", category: "Laboratory Equipment", amount: 64000, paymentMode: "cheque", ago: 12 },
    { title: "Bus diesel", category: "Transportation Cost", amount: 92000, paymentMode: "cash", ago: 7 },
    { title: "Printing — exam papers", category: "Printing", amount: 18500, paymentMode: "cash", ago: 5 },
    { title: "Housekeeping contract", category: "Cleaning", amount: 45000, paymentMode: "bank_transfer", ago: 2 },
  ];

  let incomeCount = 0;
  for (const row of INCOME) {
    const exists = await Income.findOne({ schoolId, title: row.title });
    if (exists) continue;
    await Income.create({
      schoolId, academicYearId: year._id, title: row.title, category: row.category,
      amount: row.amount, paymentMode: row.paymentMode, date: daysAgo(row.ago), createdBy: admin._id,
    });
    incomeCount += 1;
  }

  let expenseCount = 0;
  for (const row of EXPENSES) {
    const exists = await Expense.findOne({ schoolId, title: row.title });
    if (exists) continue;
    await Expense.create({
      schoolId, academicYearId: year._id, title: row.title, category: row.category,
      amount: row.amount, paymentMode: row.paymentMode, date: daysAgo(row.ago),
      status: "paid", createdBy: admin._id,
    });
    expenseCount += 1;
  }
  ok(`${incomeCount} income and ${expenseCount} expense records added`);

  // An opening balance is the one thing the sweep cannot know about — it has no source document.
  const corpus = await LedgerAccount.findOne({ schoolId, code: "3000" });
  const bank = await LedgerAccount.findOne({ schoolId, code: "1010" });
  if (corpus && bank) {
    const existing = await JournalEntry.findOne({ schoolId, narration: /opening balance/i });
    if (!existing) {
      await JournalEntry.create({
        schoolId, academicYearId: year._id,
        entryNumber: `JV-${new Date().getFullYear()}-00001`,
        date: daysAgo(60),
        narration: "Opening balance brought forward",
        lines: [
          { accountId: bank._id, debit: 1500000, credit: 0, description: "Bank" },
          { accountId: corpus._id, debit: 0, credit: 1500000, description: "Corpus" },
        ],
        status: "posted", postedAt: new Date(), postedBy: admin._id, createdBy: admin._id,
      });
      ok("Opening balance entry posted");
    }
  }

  const posted = await postPendingEvents({ schoolId, postedBy: admin._id });
  ok(`Sweep posted ${posted.posted} entr(ies)${posted.problems.length ? `, ${posted.problems.length} problem(s)` : ""}`);

  const recon = await reconciliationReport({ schoolId });
  log(`Reconciliation now reads: ${recon.isFullyPosted ? "everything posted" : `${recon.totalUnposted} still unposted`}`);

  /* ══ 3. Live bus tracking ═════════════════════════════════════ */
  step("🚌", "Bus tracking — stops on the map, a finished run and a live one");

  let driverRole = await Role.findOne({ name: "Driver", schoolId });
  if (!driverRole) {
    driverRole = await Role.create({ name: "Driver", schoolId, type: "system", code: "DRIVER" });
    ok("Driver role created");
  }

  const routes = await TransportRoute.find({ schoolId });
  const vehicles = await Transport.find({ schoolId });

  let mapped = 0;
  for (const route of routes) {
    const stops = ROUTE_STOPS[route.name];
    if (!stops || route.stopPoints?.length) continue;
    route.stopPoints = stops.map((s, i) => ({ ...s, sequence: i, radiusMeters: 150 }));
    route.stops = stops.map((s) => s.name);
    await route.save();
    mapped += 1;
  }
  ok(`${mapped} route(s) put on the map`);

  // Give the first few buses a real driver login, so the driver-side screen can be demonstrated.
  let driversLinked = 0;
  for (const [i, vehicle] of pick(vehicles, 3).entries()) {
    if (vehicle.driverId) continue;
    const email = `driver${i + 1}@${(school.slug || "school")}.demo`;
    let driver = await User.findOne({ email });
    if (!driver) {
      driver = await User.create({
        name: vehicle.driverName || `Driver ${i + 1}`,
        email,
        password: "Driver@123",
        roleId: driverRole._id,
        schoolId,
        isActive: true,
      });
    }
    vehicle.driverId = driver._id;
    await vehicle.save();
    driversLinked += 1;
  }
  ok(`${driversLinked} driver login(s) linked to buses (password: Driver@123)`);

  const mappedRoutes = await TransportRoute.find({ schoolId, "stopPoints.0": { $exists: true } });

  if (mappedRoutes.length && vehicles.length) {
    // Yesterday's completed run — gives the trip history something to show.
    const doneRoute = mappedRoutes[0];
    const doneExists = await TransportTrip.findOne({ schoolId, routeId: doneRoute._id, serviceDate: startOfDay(daysAgo(1)) });
    if (!doneExists) {
      const stops = doneRoute.stopPoints;
      const trip = await TransportTrip.create({
        schoolId, academicYearId: year._id, routeId: doneRoute._id, vehicleId: vehicles[0]._id,
        driverId: vehicles[0].driverId, serviceDate: startOfDay(daysAgo(1)), direction: "pickup",
        status: "completed",
        startedAt: new Date(startOfDay(daysAgo(1)).getTime() + 7 * 3600000),
        endedAt: new Date(startOfDay(daysAgo(1)).getTime() + 8 * 3600000),
        lastLocation: { lat: stops.at(-1).lat, lng: stops.at(-1).lng, speedKph: 0, headingDeg: null, recordedAt: new Date(startOfDay(daysAgo(1)).getTime() + 8 * 3600000) },
        stopArrivals: stops.map((s, i) => ({
          name: s.name, sequence: i,
          arrivedAt: new Date(startOfDay(daysAgo(1)).getTime() + 7 * 3600000 + (s.expectedOffsetMin + (i === 2 ? 6 : 0)) * 60000),
          lat: s.lat, lng: s.lng,
          delayMin: i === 2 ? 6 : 0,
        })),
        pingCount: 40, startedBy: admin._id, endedBy: admin._id,
      });
      ok(`Yesterday's ${doneRoute.name} run recorded (one stop 6 min late, so the delay column is not all zeroes)`);
      void trip;
    }

    // A run happening right now — this is what makes the live map worth opening.
    const liveRoute = mappedRoutes[Math.min(1, mappedRoutes.length - 1)];
    const liveVehicle = vehicles[Math.min(1, vehicles.length - 1)];
    const liveExists = await TransportTrip.findOne({ schoolId, status: "running" });
    if (!liveExists) {
      const stops = liveRoute.stopPoints;
      const startedAt = minutesAgo(22);

      // Trail: through the first two stops and part-way to the third.
      const trail = [];
      for (let i = 0; i < Math.min(2, stops.length - 1); i += 1) {
        trail.push(stops[i], ...between(stops[i], stops[i + 1], 4));
      }
      const current = trail.at(-1);

      const trip = await TransportTrip.create({
        schoolId, academicYearId: year._id, routeId: liveRoute._id, vehicleId: liveVehicle._id,
        driverId: liveVehicle.driverId, serviceDate: startOfDay(new Date()), direction: "pickup",
        status: "running", startedAt,
        lastLocation: { lat: current.lat, lng: current.lng, speedKph: 26, headingDeg: 45, recordedAt: minutesAgo(1) },
        stopArrivals: pick(stops, 2).map((s, i) => ({
          name: s.name, sequence: i,
          arrivedAt: new Date(startedAt.getTime() + s.expectedOffsetMin * 60000),
          lat: s.lat, lng: s.lng, delayMin: 0,
        })),
        pingCount: trail.length,
        startedBy: admin._id,
      });

      await VehicleLocation.insertMany(
        trail.map((p, i) => ({
          schoolId, tripId: trip._id, vehicleId: liveVehicle._id,
          lat: p.lat, lng: p.lng, speedKph: 22 + (i % 5) * 3, headingDeg: 45,
          recordedAt: new Date(startedAt.getTime() + i * 90000),
        }))
      );
      ok(`${liveRoute.name} is running right now, ${trail.length} positions on its trail, 2 stops reached`);
    } else {
      log("A trip is already running — left as it is");
    }
  } else {
    warn("No mapped routes or vehicles — skipped trips");
  }

  /* ══ 4. Attendance devices ════════════════════════════════════ */
  step("🔐", "Attendance devices — a reader, enrolled cards, this morning's scans");

  let device = await AttendanceDevice.findOne({ schoolId, name: "Staff Gate Reader" });
  let deviceSecret = null;
  if (!device) {
    const creds = generateDeviceCredentials();
    deviceSecret = creds.secret;
    device = await AttendanceDevice.create({
      schoolId, name: "Staff Gate Reader", location: "Main Gate", deviceType: "rfid",
      punchMode: "auto", appliesTo: ["staff"], deviceKey: creds.deviceKey, secret: creds.secret,
      createdBy: admin._id,
    });
    ok(`Reader registered — key ${creds.deviceKey}`);
    log(`   secret ${creds.secret}  (shown once, as it would be in the app)`);
  } else {
    log("Reader already registered");
  }

  const teacherRole = await Role.findOne({ name: "Teacher", schoolId });
  const teachers = teacherRole ? await User.find({ schoolId, roleId: teacherRole._id }).limit(12) : [];

  let enrolled = 0;
  for (const [i, teacher] of teachers.entries()) {
    const card = `CARD-${String(1001 + i)}`;
    const exists = await AttendanceCredential.findOne({ schoolId, externalId: card });
    if (exists) continue;
    await AttendanceCredential.create({
      schoolId, userId: teacher._id, role: "teacher", externalId: card,
      credentialType: "rfid", label: teacher.name, createdBy: admin._id,
    });
    enrolled += 1;
  }
  ok(`${enrolled} staff card(s) enrolled`);

  if (device && teachers.length) {
    const punches = [];
    teachers.forEach((_, i) => {
      // Most arrive on time, a couple after the grace period so "late" is not always zero.
      const arriveMin = i % 6 === 0 ? 47 : 2 + (i % 9);
      punches.push({ externalId: `CARD-${String(1001 + i)}`, punchedAt: atHourToday(8, arriveMin).toISOString() });
    });
    // Two scans from a card nobody has enrolled, so the unmatched list has something in it.
    punches.push({ externalId: "CARD-9911", punchedAt: atHourToday(8, 12).toISOString() });
    punches.push({ externalId: "CARD-9911", punchedAt: atHourToday(15, 40).toISOString() });

    // Only punches already in the past — the ingester rejects a future-dated scan as a bad clock.
    const usable = punches.filter((p) => new Date(p.punchedAt) <= new Date());

    if (usable.length) {
      const result = await ingestPunches({ device, punches: usable });
      const outcome = await applyPunches({ schoolId, punches: result.stored, device });
      ok(`${result.accepted} scan(s) taken, ${outcome.applied} marked present/late, ${outcome.unmatched} from an unknown card`);
    } else {
      log("It is before 8am — no scans seeded, they would be future-dated");
    }
  }

  /* ══ 5. Online classes ════════════════════════════════════════ */
  step("🎥", "Online classes — one finished, one today");

  const enrollments = await StudentEnrollment.find({ schoolId, status: "Active" }).limit(80).lean();
  const classIds = [...new Set(enrollments.map((e) => String(e.schoolClassId)))];
  const subjects = await Subject.find({ schoolId }).limit(3);
  const teacher = teachers[0] || admin;

  if (classIds.length) {
    const targetClass = new mongoose.Types.ObjectId(classIds[0]);
    const sectionId = enrollments.find((e) => String(e.schoolClassId) === classIds[0])?.sectionId || null;

    const done = await OnlineClass.findOne({ schoolId, title: "Algebra — revision before the unit test" });
    if (!done) {
      await OnlineClass.create({
        schoolId, academicYearId: year._id, schoolClassId: targetClass, sectionId,
        subjectId: subjects[0]?._id || null, teacherId: teacher._id,
        title: "Algebra — revision before the unit test",
        description: "Chapters 3 and 4. Bring your worked examples.",
        provider: "google_meet", meetingLink: "https://meet.google.com/demo-algebra-01",
        scheduledStart: new Date(daysAgo(2).setHours(11, 0, 0, 0)),
        scheduledEnd: new Date(daysAgo(2).setHours(12, 0, 0, 0)),
        status: "completed",
        startedAt: new Date(daysAgo(2).setHours(11, 2, 0, 0)),
        endedAt: new Date(daysAgo(2).setHours(12, 5, 0, 0)),
        recordingUrl: "https://drive.google.com/file/d/demo-algebra-recording/view",
        createdBy: teacher._id,
      });
      ok("A finished class with its recording attached");
    }

    const upcoming = await OnlineClass.findOne({ schoolId, title: "Science — light and reflection" });
    if (!upcoming) {
      // Late enough in the day that it is still ahead whenever the demo is given, and the link
      // opens 15 minutes before — so the student view shows the countdown rather than a live link.
      const created = await OnlineClass.create({
        schoolId, academicYearId: year._id, schoolClassId: targetClass, sectionId,
        subjectId: subjects[1]?._id || subjects[0]?._id || null, teacherId: teacher._id,
        title: "Science — light and reflection",
        description: "Live demonstration with the lab mirrors.",
        provider: "google_meet", meetingLink: "https://meet.google.com/demo-science-02",
        scheduledStart: atHourToday(16, 0),
        scheduledEnd: atHourToday(17, 0),
        linkVisibleBeforeMin: 15,
        status: "scheduled",
        createdBy: teacher._id,
      });

      // A handful of joins on the finished class, so the join log is not empty.
      const finished = await OnlineClass.findOne({ schoolId, status: "completed" });
      if (finished) {
        const studentUsers = await Student.find({ schoolId }).limit(9).select("userId").lean();
        for (const [i, s] of studentUsers.entries()) {
          if (!s.userId) continue;
          const exists = await OnlineClassJoin.findOne({ onlineClassId: finished._id, userId: s.userId });
          if (exists) continue;
          await OnlineClassJoin.create({
            schoolId, onlineClassId: finished._id, userId: s.userId, role: "student",
            firstJoinedAt: new Date(new Date(finished.scheduledStart).getTime() + (i % 8) * 60000),
            lastJoinedAt: new Date(new Date(finished.scheduledStart).getTime() + (i % 8) * 60000),
            joinCount: 1, minutesAfterStart: i % 8,
          });
        }
      }
      ok(`"${created.title}" scheduled for 4pm today, plus joins logged on the finished class`);
    }
  } else {
    warn("No active enrollments — skipped online classes");
  }

  /* ══ 6. Report card template ══════════════════════════════════ */
  step("📄", "Report cards — a term template ready to generate from");

  const exams = await Exam.find({ schoolId, academicYearId: year._id }).limit(3);
  if (exams.length >= 2) {
    const exists = await ReportCardTemplate.findOne({ schoolId, academicYearId: year._id, name: /term 1/i });
    if (!exists) {
      const weights = exams.length >= 3 ? [30, 30, 40] : [50, 50];
      await ReportCardTemplate.create({
        schoolId, academicYearId: year._id,
        name: `Term 1 — ${year.name}`,
        exams: pick(exams, weights.length).map((e, i) => ({ examId: e._id, weightage: weights[i] })),
        coScholasticAreas: [{ name: "Discipline" }, { name: "Art" }, { name: "Sports" }],
        status: "active",
        createdBy: admin._id,
      });
      ok(`Template created over ${weights.length} exams (${weights.join("/")}%) — press Generate in the app to build the cards`);
    } else {
      log("Template already exists");
    }
  } else {
    warn("Fewer than 2 exams found — run scripts/seedExamData.mjs first for report cards");
  }

  /* ══ Done ═════════════════════════════════════════════════════ */
  console.log(`\n${"─".repeat(58)}`);
  console.log("✅  Demo data ready.\n");
  console.log("   Worth opening, in this order:");
  console.log("     Accountant  → Accounting → Reconciliation, then Financial Statements");
  console.log("     Transport Manager → Live Tracking   (a bus is moving right now)");
  console.log("     School Admin → Govt. Compliance → Readiness");
  console.log("     School Admin → Attendance → Biometric / RFID");
  console.log("     Teacher → Online Classes            (one at 4pm today)");
  if (deviceSecret) console.log(`\n   Device secret, shown once: ${deviceSecret}`);
  console.log("");

  await mongoose.disconnect();
}

// Only runs itself when invoked directly, so it can also be imported and awaited — which is how
// it gets verified against a throwaway database instead of a real one.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error("\n❌ ", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

/**
 * Attendance Module Demo Data Seeder
 * Run: node scripts/seedAttendanceData.mjs   (from backend/ directory)
 *
 * Creates attendance records for the last 30 days covering:
 *  - Students (marked by teacher)
 *  - Teachers (self-attendance / admin-marked)
 *  - Staff roles (self-attendance)
 *  - School Admin view data
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const URI = process.env.MONGOOSE_URI;
if (!URI) { console.error("❌  MONGOOSE_URI not found in .env"); process.exit(1); }

const ok   = (m) => console.log(`  ✅ ${m}`);
const warn = (m) => console.log(`  ⚠️  ${m}`);
const info = (m) => console.log(`  ℹ️  ${m}`);
const sep  = ()  => console.log("\n" + "─".repeat(60));

await mongoose.connect(URI);
ok("MongoDB connected");

/* ── Dynamic imports of models ── */
const db = mongoose.connection.db;
const users       = db.collection("users");
const roles       = db.collection("roles");
const schools     = db.collection("schools");
const students    = db.collection("students");
const enrollments = db.collection("studentenrollments");
const attendance  = db.collection("attendances");

sep();
console.log("📋  Attendance Demo Data Seeder");
sep();

/* ── 1. Find the demo school ── */
const school = await schools.findOne({});
if (!school) { console.error("❌  No school found. Run other seed scripts first."); process.exit(1); }
const schoolId = school._id;
ok(`School: ${school.name} (${schoolId})`);

/* ── 2. Find users by role ── */
const findRole = async (roleName) => roles.findOne({ name: roleName });
const findUsersByRole = async (roleName, limit = 10) => {
  const role = await findRole(roleName);
  if (!role) { warn(`Role not found: ${roleName}`); return []; }
  return users.find({ roleId: role._id, schoolId, isDeleted: { $ne: true } }).limit(limit).toArray();
};

const teacherUsers   = await findUsersByRole("Teacher", 5);
const studentUsers   = await findUsersByRole("Student", 15);
const staffUsers     = await findUsersByRole("Staff", 5);
const adminUsers     = await findUsersByRole("School Admin", 2);
const principalUsers = await findUsersByRole("Principal", 1);
const wardenUsers    = await findUsersByRole("Hostel Warden", 1);
const accountantUsers = await findUsersByRole("Accountant", 1);

info(`Teachers: ${teacherUsers.length}, Students: ${studentUsers.length}, Staff: ${staffUsers.length}`);
info(`Admins: ${adminUsers.length}, Principal: ${principalUsers.length}, Warden: ${wardenUsers.length}`);

if (!teacherUsers.length && !studentUsers.length) {
  warn("No users found. Please seed users first (register via the app).");
  process.exit(0);
}

/* ── 3. Find an admin user to be the "markedBy" fallback ── */
const adminUser = adminUsers[0] || principalUsers[0] || teacherUsers[0];
if (!adminUser) { console.error("❌  No admin/teacher user found to act as marker."); process.exit(1); }
const markerId = adminUser._id;
ok(`Marker (markedBy): ${adminUser.name}`);

/* ── 4. Find a class-section for student attendance ── */
const classes = db.collection("schoolclasses");
const sections = db.collection("sections");
const schoolClass = await classes.findOne({ schoolId });
const section = schoolClass
  ? await sections.findOne({ schoolClassId: schoolClass._id })
  : null;

if (schoolClass) ok(`Class: ${schoolClass.name}, Section: ${section?.name || "N/A"}`);
else warn("No class found — student attendance will have no class link");

/* ── 5. Helper: build date list (last 30 working days) ── */
function workingDates(count = 30) {
  const dates = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (dates.length < count) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) { // skip Sun/Sat
      dates.push(new Date(d));
    }
  }
  return dates;
}

const DATES = workingDates(30);

/* ── 6. Status distribution helpers ── */
const studentStatuses = ["present","present","present","present","present","present","present","absent","late","halfday"];
const staffStatuses   = ["present","present","present","present","present","present","present","present","absent","late"];

const pick = (arr, seed) => arr[seed % arr.length];

/* ── 7. Build attendance docs ── */
const docs = [];

const makeDoc = (userId, roleSlug, date, status, markedBy, extraFields = {}) => ({
  schoolId,
  userId,
  role: roleSlug,
  schoolClassId: null,
  sectionId: null,
  subjectId: null,
  date,
  status,
  markedBy,
  remarks: "",
  checkInAt: null,
  checkOutAt: null,
  checkInGps: { lat: null, lng: null, accuracy: null },
  checkOutGps: { lat: null, lng: null, accuracy: null },
  gpsVerified: false,
  distanceFromSchool: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...extraFields,
});

/* ── Students ── */
const teacher = teacherUsers[0];
const teacherMarker = teacher ? teacher._id : markerId;

for (const student of studentUsers) {
  const seed = student._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(studentStatuses, seed + i);
    docs.push(makeDoc(
      student._id, "student", DATES[i], status, teacherMarker,
      {
        schoolClassId: schoolClass?._id || null,
        sectionId: section?._id || null,
      }
    ));
  }
}
ok(`Queued ${studentUsers.length * DATES.length} student attendance records`);

/* ── Teachers (self-attendance with GPS sim) ── */
for (const t of teacherUsers) {
  const seed = t._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(staffStatuses, seed + i);
    const date = DATES[i];
    const checkIn  = new Date(date); checkIn.setUTCHours(8, 30, 0, 0);
    const checkOut = new Date(date); checkOut.setUTCHours(15, 30, 0, 0);
    const isPresent = status === "present" || status === "late";
    docs.push(makeDoc(
      t._id, "teacher", date, status, t._id,
      {
        checkInAt:  isPresent ? checkIn  : null,
        checkOutAt: isPresent ? checkOut : null,
        gpsVerified: isPresent,
        distanceFromSchool: isPresent ? Math.round(Math.random() * 50 + 10) : null,
        checkInGps:  isPresent ? { lat: 28.6139, lng: 77.2090, accuracy: 15 } : { lat: null, lng: null, accuracy: null },
        checkOutGps: isPresent ? { lat: 28.6139, lng: 77.2090, accuracy: 12 } : { lat: null, lng: null, accuracy: null },
      }
    ));
  }
}
ok(`Queued ${teacherUsers.length * DATES.length} teacher attendance records`);

/* ── Staff ── */
for (const s of staffUsers) {
  const seed = s._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(staffStatuses, seed + i);
    docs.push(makeDoc(s._id, "staff", DATES[i], status, s._id));
  }
}
ok(`Queued ${staffUsers.length * DATES.length} staff attendance records`);

/* ── Hostel Warden ── */
for (const w of wardenUsers) {
  const seed = w._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(staffStatuses, seed + i);
    docs.push(makeDoc(w._id, "hostel_warden", DATES[i], status, w._id));
  }
}

/* ── Accountant ── */
for (const a of accountantUsers) {
  const seed = a._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(staffStatuses, seed + i);
    docs.push(makeDoc(a._id, "accountant", DATES[i], status, a._id));
  }
}

/* ── Principal ── */
for (const p of principalUsers) {
  const seed = p._id.toString().charCodeAt(0);
  for (let i = 0; i < DATES.length; i++) {
    const status = pick(staffStatuses, seed + i);
    docs.push(makeDoc(p._id, "principal", DATES[i], status, p._id));
  }
}

info(`Total docs to upsert: ${docs.length}`);

/* ── 8. Bulk upsert (upsert to avoid duplicate key errors) ── */
if (docs.length === 0) {
  warn("Nothing to insert.");
  process.exit(0);
}

sep();
console.log("📝  Upserting attendance records...");

const BATCH = 200;
let inserted = 0, updated = 0, errors = 0;

for (let i = 0; i < docs.length; i += BATCH) {
  const batch = docs.slice(i, i + BATCH);
  try {
    const result = await attendance.bulkWrite(
      batch.map((doc) => ({
        updateOne: {
          filter: { schoolId: doc.schoolId, userId: doc.userId, date: doc.date },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      })),
      { ordered: false }
    );
    inserted += result.upsertedCount || 0;
    updated  += result.matchedCount  || 0;
  } catch (e) {
    errors++;
    warn(`Batch ${Math.floor(i / BATCH) + 1} error: ${e.message?.slice(0, 80)}`);
  }
}

sep();
ok(`Inserted: ${inserted} new records`);
ok(`Skipped (already existed): ${updated}`);
if (errors) warn(`Batch errors: ${errors}`);

/* ── 9. Summary ── */
sep();
const total = await attendance.countDocuments({ schoolId });
ok(`Total attendance records in DB for this school: ${total}`);
console.log("\n🎉  Attendance seed complete!\n");
console.log("   You can now test:");
console.log("   • School Admin → Attendance Dashboard (charts, low-attendance list)");
console.log("   • Teacher → Student Attendance (mark students)");
console.log("   • Teacher/Staff → My Attendance (monthly history)");
console.log("   • Teacher/Staff → GPS Self-Attendance (check-in/out)");
console.log("   • Student → My Attendance (view own record)");
console.log("   • Parent → Child Attendance (view child's record)");
console.log("   • School Admin → Monthly Report (aggregate stats)\n");

await mongoose.disconnect();

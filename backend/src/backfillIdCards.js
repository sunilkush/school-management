/**
 * ID Card Backfill Script — ADDITIVE ONLY (never deletes/modifies existing data)
 * Generates an ID card for every currently-active student, across every school, who doesn't
 * already have one. Existing/deactivated cards are left untouched; students with an active
 * card are skipped.
 * Run: cd backend && node src/backfillIdCards.js
 */
import dbConnection from "./db/index.js";
import mongoose from "mongoose";
import { StudentEnrollment } from "./models/StudentEnrollment.model.js";
import { IDCard } from "./models/IDCard.model.js";
// Registers models referenced via populate() inside issueStudentIdCard's resolveStudentEnrollment
// (schoolClassId -> SchoolClass, sectionId -> Section, userId -> User) — mongoose throws
// "Schema hasn't been registered" for any ref whose model file was never imported.
import { User } from "./models/user.model.js";
import { Role } from "./models/Roles.model.js";
import "./models/student.model.js";
import "./models/school.model.js";
import "./models/schoolClass.model.js";
import "./models/section.model.js";
import { issueStudentIdCard } from "./controllers/idCard.controllers.js";

// IDCard.generatedBy is a required ref to the acting admin user — this backfill has no request
// context, so attribute each school's cards to that school's own School Admin (falling back to
// any Super Admin) rather than loosening the schema for a one-off script.
const resolveGeneratedByPerSchool = async () => {
  // "School Admin" is a per-school Role document (unique on {name, schoolId}), not one global
  // role shared by every school — so every matching role doc needs to be collected, not just
  // the first one findOne would return.
  const schoolAdminRoles = await Role.find({ name: "School Admin" }).select("_id").lean();
  const superAdminRole = await Role.findOne({ name: "Super Admin" }).select("_id").lean();

  const admins = schoolAdminRoles.length
    ? await User.find({ roleId: { $in: schoolAdminRoles.map((r) => r._id) } })
        .select("_id schoolId")
        .lean()
    : [];
  const bySchool = new Map(admins.map((a) => [String(a.schoolId), a._id]));

  const fallback = superAdminRole
    ? await User.findOne({ roleId: superAdminRole._id }).select("_id").lean()
    : null;

  return { bySchool, fallbackUserId: fallback?._id || null };
};

const run = async () => {
  await dbConnection();

  const { bySchool: adminBySchool, fallbackUserId } = await resolveGeneratedByPerSchool();

  const activeEnrollments = await StudentEnrollment.find({ status: "Active" })
    .select("studentId schoolId")
    .lean();

  const seen = new Set();
  const students = [];
  for (const e of activeEnrollments) {
    const key = String(e.studentId);
    if (seen.has(key)) continue;
    seen.add(key);
    students.push({ studentId: e.studentId, schoolId: e.schoolId });
  }

  const existingCards = await IDCard.find({ holderType: "Student", status: "Active" })
    .select("holderId")
    .lean();
  const alreadyCarded = new Set(existingCards.map((c) => String(c.holderId)));

  const pending = students.filter((s) => !alreadyCarded.has(String(s.studentId)));

  console.log(`Active students found: ${students.length}`);
  console.log(`Already have an active ID card: ${alreadyCarded.size}`);
  console.log(`Generating ID cards for: ${pending.length} students`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const s of pending) {
    const generatedBy = adminBySchool.get(String(s.schoolId)) || fallbackUserId;
    if (!generatedBy) {
      skipped += 1;
      console.warn(`Skipped studentId=${s.studentId} — no admin user found to attribute the card to`);
      continue;
    }
    try {
      const card = await issueStudentIdCard({
        schoolId: s.schoolId,
        studentId: s.studentId,
        generatedBy,
      });
      if (card) {
        created += 1;
      } else {
        skipped += 1;
        console.warn(`Skipped studentId=${s.studentId} — no matching Student record`);
      }
    } catch (err) {
      failed += 1;
      console.error(`Failed for studentId=${s.studentId}: ${err.message}`);
    }
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}  Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
